export enum GenoState {
    Ready = 1,
    Listening,
    Success,
    Error,
}

export enum GenoColor {
    Default = "lightgray",
    Success = "#28CB7",
    Error = "#EB503A",
    Theme = "#4A90E2"
}

export enum GenoContextType {
    Element = "element",        // Return elements
    Attribute = "attribute",    // Return element attribute(s)
    Text = "text"               // Return selected/highlighted text
}

export type GenoMessage = { text: string, who: string };

export class GenoContextInfo {
    type: GenoContextType;
    parameter: string | null;       // Parameter to map context to 
    selector: string;               // Can be a (1) tag + class (2) id or (3) *
    attributes: string[];           // Attributes to return

    constructor(command: GenoCommand) {
        var contextInfo = command.info.contextInfo;
        this.parameter = contextInfo.parameter;
        this.type = contextInfo.type;
        this.selector = contextInfo.selector;
        this.attributes = contextInfo.attributes;
    }
}

export class GenoCommand {
    query: string;
    entities: any[];
    info: any;
    extractedParams: string[];
    expectedParams: string[];
    contextInfo: GenoContextInfo;
    context?: string | Element | (string | Element | string[])[];

    constructor(query: string, entities: any[], info: any, context) {
        this.query = query;
        this.entities = entities;
        this.info = info;
        this.extractedParams = [];
        this.expectedParams = Object.keys(info.parameters); // Can always assume in correct call order
        this.contextInfo = new GenoContextInfo(this);
        this.context = context;
    }

    didExtractAllParams() {
        return this.extractedParams.length == this.expectedParams.length;
    }

    entityForParameter(parameter: string) {
        return this.entities.find(e => e.entity === parameter);
    }

    backupQuestion(parameter: string) {
        var backupQuestion = this.info.parameters[parameter];
        if (backupQuestion === "") {
            backupQuestion = "What is " + parameter + "?";
        }
        return backupQuestion;
    }

    /** Intelligently convert parameter to an appropriate type and add to extractedParams */
    addParameter(value: any) {
        if (!isNaN(parseInt(value))) {
            value = parseInt(value);
        }
        this.extractedParams.push(value);
    }

    canUseContextForParameter(parameter: string) {
        if (this.context == null || (this.context.hasOwnProperty("length") && this.context["length"] === 0)) {
            return false;
        }
        return this.contextInfo.parameter === parameter && this.context != null;
    }
    
}

export class Geno {

    onfinalmessage: ((message: GenoMessage) => void) | null;

    devId: number;
    currentCommand: GenoCommand;
    commands: { [id: string]: any }; 
    chatHistory: GenoMessage[];
    isListening: boolean;
    isCollapsed: boolean;

    // Multimodal Context
    contextElements?: Element[] | null;
    mouseState = {
        isMouseDown: false,
        isDragging: false,
        isTrackingHover: false,
        selection: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }
    }

    // Listeners
    onMouseDownListener: (event: MouseEvent) => void;
    onMouseMoveListener: (event: MouseEvent) => void;
    onMouseUpListener: (event: MouseEvent) => void;

    // HTML Elements
    box?: HTMLDivElement;
    currentMessage?: HTMLDivElement;
    bubble?: HTMLDivElement;
    listeningIndicator?: HTMLDivElement;
    micButton?: HTMLInputElement;
    selectionRect?: HTMLDivElement;

    // Timers
    borderTimer?: number;
    listeningTimer?: number;
    
    // Speech Recognition Class
    recognition?: SpeechRecognition;

    constructor() {
        this.devId = -1;
        this.onfinalmessage = null;
        this.commands = {};
        this.chatHistory = [];
        this.isListening = false;
        this.isCollapsed = true;

        this.onMouseDownListener = this.onMouseDown.bind(this);
        this.onMouseMoveListener = this.onMouseMove.bind(this);
        this.onMouseUpListener = this.onMouseUp.bind(this);
    }

    /** Configure developer ID */
    setDevId(devId: number) {
        this.devId = devId;
    }

    /** Convenient method to initialize Geno */
    start(devId: number) {
        this.addPopover();
        this.setDevId(devId);

        // Enable Geno using ` key
        document.addEventListener("keyup", (e) => {
            if (e.key === '\`' && !this.activeElementHasEditableText()) {
                this.togglePopover();
            }
        });
    }

    /*** Speech Functions ***/

    /** Display/speak phrase to user */
    respond(phrase: string, speak: boolean = true, callback: (() => void) | null = null): void {
        this.currentMessage.textContent = phrase;
        this.addChatMessage(phrase, "geno");

        if (speak) {
            var utterance = new SpeechSynthesisUtterance(phrase);
            utterance.onend = callback;
            speechSynthesis.speak(utterance);
        }
    }

    /** Display/speak phrase to user and execute callback on user response */
    ask(phrase: string, speak: boolean = true, callback: (message: GenoMessage) => void): void {
        this.respond(phrase, speak, () => {
            this.onfinalmessage = callback;
            this.startListening();
        });
    }

/*** Multimodal Context Functions ***/
    
    startTrackingContext() {
        this.mouseState.isTrackingHover = true;
        document.body.appendChild(this.selectionRect);
        document.addEventListener("mousedown", this.onMouseDownListener);
        document.addEventListener("mousemove", this.onMouseMoveListener);
        document.addEventListener("mouseup", this.onMouseUpListener);
    }
    
    stopTrackingContext() {
        this.mouseState.isTrackingHover = false;
        this.mouseState.isDragging = false;
        this.clearContextHighlights();
        document.body.removeChild(this.selectionRect);
        document.removeEventListener("mousedown", this.onMouseDownListener);
        document.removeEventListener("mousemove", this.onMouseMoveListener);
        document.removeEventListener("mouseup", this.onMouseUpListener);
    }
    
    /** Checks if current active element uses keyboard for input */
    activeElementHasEditableText() {
        var activeDiv = <HTMLDivElement>document.activeElement;
        return document.activeElement.nodeName === 'INPUT'
            || document.activeElement.nodeName === 'TEXTAREA'
            || activeDiv.isContentEditable;
    }
    
    /** Event listener for mousedown events */
    onMouseDown(event: MouseEvent) {
        this.mouseState.isMouseDown = true;
        this.mouseState.selection.left = event.clientX;
        this.mouseState.selection.top = event.clientY;
    }

    /** Event listener for mousemove events */
    onMouseMove(event: MouseEvent) {
        if (!this.mouseState.isMouseDown && this.mouseState.isTrackingHover) {
            this.clearContextHighlights();
            this.contextElements = this.selectPointContext({ x: event.clientX, y: event.clientY });
            this.setContextHighlights();
        } else if (this.mouseState.isMouseDown) {
            this.mouseState.isDragging = true;
            this.mouseState.isTrackingHover = false;
        }

        if (this.mouseState.isDragging) {
            this.mouseState.selection.right = event.clientX;
            this.mouseState.selection.bottom = event.clientY;
            this.drawSelectionRectangle();
        } else {
            this.hideSelectionRectangle();
        }
    }

    /** Event listener for mouseup events */
    onMouseUp(event: MouseEvent) {
        if (this.mouseState.isDragging) {
            this.clearContextHighlights();
            this.contextElements = this.selectDragContext();
            this.setContextHighlights();
            this.mouseState.isDragging = false;
        } else {
            this.contextElements = [];
            this.mouseState.isTrackingHover = true;
        }

        this.mouseState.isMouseDown = false;
        this.hideSelectionRectangle();
    }

    selectPointContext(mousePosition: { [id: string]: number }) {
        return [document.elementFromPoint(mousePosition.x, mousePosition.y)];
    }

    selectDragContext() {
        // Find elements inside our selection rectangle
        return Array.from(document.querySelectorAll("*")).filter(el =>
            this.mouseState.selection.left <= el.getBoundingClientRect().left &&
            this.mouseState.selection.top <= el.getBoundingClientRect().top &&
            this.mouseState.selection.right >= el.getBoundingClientRect().right &&
            this.mouseState.selection.bottom >= el.getBoundingClientRect().bottom
        );
    }

    extractContext(contextInfo: GenoContextInfo) {
        if (this.contextElements == null) return null;

        // Helper function to extract context for an element
        var extractElementContext = function(element: Element) {
            switch (contextInfo.type) {
                case GenoContextType.Element:
                    return element;
                case GenoContextType.Attribute:
                    var attributes = contextInfo.attributes.map(attr => element.getAttribute(attr));
                    return attributes.length === 1 ? attributes[0] : attributes;
            }
        }

        // Return highlighted text if context type is text
        if (contextInfo.type === GenoContextType.Text && window.getSelection) {
            return window.getSelection().toString();
        } else {
            var query = contextInfo.selector;
            query += contextInfo.attributes.map(attr => "[" + attr + "]");
            var elements = this.contextElements
                .filter(el => el.matches(query))
                .map(el => extractElementContext(el));
            
            return elements.length === 1 ? elements[0] : elements;
        }
    }

    setContextHighlights() {
        if (this.contextElements == null) return;
        this.contextElements.forEach(el => {
            this.applyMask(el);
        });
    }

    clearContextHighlights() {
        if (this.contextElements == null) return;
        this.clearMasks();
    }

    /* Adds highlight to element */
    applyMask(target: Element) {
        this.createMask(target);
    }

    /* Change size of highlight for element */
    resizeMask(target: Element) {
        var rect = target.getBoundingClientRect();
        var hObj = <HTMLElement>document.getElementsByClassName('highlight-wrap')[0];
        hObj.style.top = rect.top + "px";
        hObj.style.width = rect.width + "px";
        hObj.style.height = rect.height + "px";
        hObj.style.left = rect.left + "px";
    }

    /* Creates the highlight for an element */
    createMask(target: Element) {
        var rect = target.getBoundingClientRect();
        var hObj = document.createElement("div");
        hObj.className = 'highlight-wrap';
        hObj.style.position = 'absolute';
        hObj.style.top = rect.top + "px";
        hObj.style.width = rect.width + "px";
        hObj.style.height = rect.height + "px";
        hObj.style.left = rect.left + "px";
        hObj.style.backgroundColor = 'skyblue';
        hObj.style.opacity = '0.5';
        hObj.style.cursor = 'default';
        hObj.style.pointerEvents = 'none';
        document.body.appendChild(hObj);
    }

    /* Remove highlights */
    clearMasks() {
        Array.from(document.getElementsByClassName("highlight-wrap")).forEach(el => document.body.removeChild(el));
    }

    drawSelectionRectangle() {
        if (this.selectionRect === undefined) return;

        this.selectionRect.style.left = `${this.mouseState.selection.left}px`;
        this.selectionRect.style.top = `${this.mouseState.selection.top + window.scrollY}px`;
        this.selectionRect.style.width = `${this.mouseState.selection.right - this.mouseState.selection.left}px`;
        this.selectionRect.style.height = `${this.mouseState.selection.bottom - this.mouseState.selection.top}px`;
        this.selectionRect.style.opacity = '0.5';
    }

    hideSelectionRectangle() {
        if (this.selectionRect === undefined) return;

        this.selectionRect.style.opacity = '0';
        this.mouseState.selection = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        };
    }

    /*** Listening Functions ***/

    /** Adds a new message to the chat history */
    addChatMessage(text: string, who: string): GenoMessage | null {
        if (text != "..." && text != "") {
            var message = { text: text, who: who };
            this.chatHistory.push(message);
            if (who === "user") {
                this.bubble.textContent = text;
                this.bubble.style.visibility = 'visible';
                this.bubble.className = "geno-last-phrase";
            }
            return message;
        }
        return null;
    }

    /** Initialize recognition system */
    initRecognition() {
        try {
            window.SpeechRecognition = (window as any).webkitSpeechRecognition || window.SpeechRecognition;
            this.recognition = new window.SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                this.transcribe(event.results[0][0].transcript);

                if (event.results[0].isFinal) {
                    this.listeningTimer = window.setTimeout(() => this.stopListening.call(this), 1000);
                } else if (this.listeningTimer) {
                    clearTimeout(this.listeningTimer);
                }
            };

            this.recognition.onstart = () => {
                this.transcribe("...");
                this.micButton.disabled = false;
            };
        } catch (error) {
            if (error) {
                this.transcribe("Browser doesn't support SpeechRecognition");
            }
        }
    }

    /** Start listening action using SpeechRecognition */
    startListening() {
        if (this.isListening || !this.recognition) return;

        speechSynthesis.cancel();
        this.listeningIndicator.style.visibility = "visible";
        this.micButton.style.color = GenoColor.Theme;
        this.setBorderColor(GenoState.Listening);
        this.micButton.disabled = true;
        this.isListening = true;

        this.recognition.start();
        this.startTrackingContext();
    }

    /** Stop any listening action */
    stopListening() {
        if (!this.isListening || !this.recognition) return;

        this.stopTrackingContext();
        this.recognition.abort();
        this.isListening = false;

        this.listeningIndicator.style.visibility = "hidden";
        this.micButton.style.color = "black";
        this.setBorderColor();

        var transcript = this.currentMessage.textContent;
        if (transcript != null) {
            this.addChatMessage(transcript, "user");

            if (transcript !== "..." && this.chatHistory.length) {
                var message = this.chatHistory.slice(-1)[0];
                if (this.onfinalmessage) {
                    this.onfinalmessage(message);
                } else {
                    this.executeCommand(message.text);
                }
            }
        }

        this.micButton.disabled = false;
    }

    /*** Control Functions ***/
    
    /** Execute appropriate function based on match to query */
    executeCommand(query: string) {
        if (typeof query != "string") return;
        if (this.devId == -1) {
            console.warn("You need to set your developer ID using geno.configure(DEV_ID)");
            return;
        }

        var xhr = new XMLHttpRequest();
        var url = "http://localhost:3001/response?dev_id=" + encodeURIComponent(this.devId) + "&query=" + encodeURIComponent(query);
        xhr.open('GET', url);

        xhr.onload = () => {
            var json = JSON.parse(xhr.responseText);
            var confidence = json.intent.confidence;
            var info = this.commands[json.intent.name];

            // Only 1 command so always use it (since backend does not create classifer for 1 command)
            if (Object.keys(this.commands).length == 1) {
                info = Object.values(this.commands)[0];
            }

            console.log(json);
            
            var context = this.extractContext(info.contextInfo)
            console.log("Context: " + context);
            this.currentCommand = new GenoCommand(query, json.entities, info, context);

            if (info && (json.intent_ranking.length == 0 || confidence > 0.50)) {
                if (info.type === "demo") {
                    // TODO: include context or capture all this info in a new GenoDemoCommand
                    this.clickElements();
                } else if (info.type === "function") {
                    this.extractParameters();
                }
            } else {
                this.respond("Sorry, I didn't understand.");
                this.setBorderColor(GenoState.Error);
            }
        };

        xhr.send();
    }

    /** A recursive/callback based function to retrieve all arguments and trigger function */
    extractParameters() {
        // All arguments retrieved, so trigger function
        if (this.currentCommand.didExtractAllParams()) {
            import("../" + this.currentCommand.info.file)
                .then((module) => {
                    var fn = module[this.currentCommand.info.triggerFn];
                    if (fn) {
                        var result = module[this.currentCommand.info.triggerFn].apply(null, this.currentCommand.extractedParams);
                        console.log("Result of " + this.currentCommand.info.triggerFn + ": " + result);
                    } else {
                        console.error("Error: Could not find function '" + this.currentCommand.info.triggerFn + "' in module '" + this.currentCommand.info.file) + "'";
                    }
                    this.currentCommand = null;
                });
            return;
        }

        // Retrieve arguments
        for (let index = this.currentCommand.extractedParams.length; index < this.currentCommand.expectedParams.length; index++) {
            var expectedParam = this.currentCommand.expectedParams[index];
            var entity = this.currentCommand.entityForParameter(expectedParam);

            if (entity == null) {
                if (this.currentCommand.canUseContextForParameter(expectedParam)) {
                    this.currentCommand.addParameter(this.currentCommand.context);
                } else {
                    this.ask(this.currentCommand.backupQuestion(expectedParam), true, (answer) => {
                        this.onfinalmessage = null;
                        this.currentCommand.addParameter(answer.text);
                        this.extractParameters();
                    });
                    return;
                }
            } else {
                // FIXME: remove check for entity.value and just use entity.value once it is fixed
                this.currentCommand.addParameter(entity.value !== "None" ? entity.value : this.currentCommand.query.slice(entity.start, entity.end));
            }
        }
        this.extractParameters();
    }

    /** Recursive function to simulate clicks for demo command */
    clickElements(i: number = 0) {
        var elements = this.currentCommand.info.elements;
        var parameters = this.currentCommand.info.parameters;

        if (i >= elements.length) { return; }

        // Find element in webpage to click on
        var el = document.getElementsByTagName(elements[i].tag)[elements[i].index];
        el.click();
        el.focus();

        // Handles if this step in demonstration needs a parameter input
        var expectedParam = parameters.find(p => p.index === i);
        if (expectedParam) {
            var entity = this.currentCommand.entityForParameter(expectedParam.name)
            if (entity == null) {
                if (this.currentCommand.canUseContextForParameter(expectedParam.name)) {
                    el.textContent += this.currentCommand.context.toString()
                } else {
                    var backupQuestion = backupQuestion === "" ?
                        this.currentCommand.info.parameters[expectedParam.name] :
                        backupQuestion = "What is " + expectedParam.name + "?";

                    this.ask(backupQuestion, true, (answer) => {
                        this.onfinalmessage = null;
                        el.textContent += answer.text;
                        setTimeout(() => {
                            this.clickElements(i + 1);
                        }, this.currentCommand.info.delay * 1000);
                    });
                    return;
                }
            } else {
                // FIXME: Sometimes entity.value is None
                var value = entity.value !== "None" ? entity.value : this.currentCommand.query.slice(entity.start, entity.end);
                el.textContent += value;
            }
        }

        setTimeout(() => {
            this.clickElements(i + 1);
        }, this.currentCommand.info.delay * 1000);
    }

    /*** UI Functions ***/

    /** Transcribe text to popover */
    transcribe(text: string) {
        this.currentMessage.textContent = text;
    }

    /** Add Geno popover to body of webpage */
    addPopover() {
        var popover = document.createElement("div");
        popover.id = "geno-ui";
        popover.classList.add("geno-slide-out");
        
        var genoChat = document.createElement("div");
        genoChat.className = "geno-chat";
        var genoCurr = document.createElement("div");
        genoCurr.id = "geno-curr";
        genoCurr.innerText = "...";
        genoChat.appendChild(genoCurr);
        popover.appendChild(genoChat);

        var genoIndicatorBox = document.createElement("div");
        genoIndicatorBox.className = "geno-indicator-box";

        var genoButtonCenter = document.createElement("div");
        genoButtonCenter.className = "geno-button-center";
        
        var genoIndicator = document.createElement("div");
        genoIndicator.id = "geno-indicator";
        genoIndicator.className = "la-ball-scale-multiple la-2x";
        genoIndicator.appendChild(document.createElement("div"))
        genoIndicator.appendChild(document.createElement("div"))

        var genoMic = document.createElement("div");
        genoMic.id = "geno-mic";
        genoMic.style.height = "30px";
        genoMic.style.width = "20px";
        genoMic.onclick = () => this.togglePopover.call(this);
        genoMic.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>`

        genoButtonCenter.appendChild(genoIndicator);
        genoButtonCenter.appendChild(genoMic);
        genoIndicatorBox.appendChild(genoButtonCenter);
        popover.appendChild(genoIndicatorBox);

        var genoClose = document.createElement("div");
        genoClose.id = "geno-close";
        genoClose.onclick = () => this.collapsePopover.call(this);
        genoClose.innerHTML = `<div style="height: 15px; width: 15px;">
            <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-right" class="svg-inline--fa fa-arrow-right fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path></svg>`;
        popover.appendChild(genoClose);

        document.body.appendChild(popover);

        // Create bubble
        var bubble = document.createElement("div");
        bubble.id = "geno-bubble";
        bubble.style.visibility = "hidden";
        document.body.appendChild(bubble);

        this.box = popover;
        this.currentMessage = genoCurr;
        this.listeningIndicator = genoIndicator;
        this.micButton = <HTMLInputElement>genoMic;
        this.bubble = bubble;

        // Add context selection rectangle
        this.selectionRect = document.createElement("div");
        this.selectionRect.id = "geno-select-rect";

        this.initRecognition();
    }

    /** Hide/show popover */
    togglePopover() {
        if (this.isCollapsed) {
            this.box.style.right = "10px";
            this.isCollapsed = false;
        }

        this.isListening ? this.stopListening() : this.startListening();
    }

    /** Hide popover */
    collapsePopover() {
        if (!this.isCollapsed) {
            this.box.style.right = "-342px";
            this.bubble.style.visibility = "hidden"
            this.isCollapsed = true
        }
        this.stopListening();
    }

    /** Modify UI border color based on current state */
    setBorderColor(state: GenoState = GenoState.Ready) {
        if (this.borderTimer) {
            clearTimeout(this.borderTimer);
        }
        switch (state) {
            case GenoState.Listening:
                this.box.style.borderColor = GenoColor.Theme;
                return;
            case GenoState.Success:
                this.box.style.borderColor = GenoColor.Success;
                break;
            case GenoState.Error:
                this.box.style.borderColor = GenoColor.Error;
                break;
            case GenoState.Ready:
                this.box.style.borderColor = GenoColor.Default;
                return;
        }
        this.borderTimer = window.setTimeout(() => this.setBorderColor.call(this), 3000);
    }

}

export var geno = new Geno();