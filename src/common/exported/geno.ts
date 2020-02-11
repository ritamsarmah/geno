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

export type GenoMessage = { text: string, who: string };

export class Geno {

    onfinalmessage: ((message: GenoMessage) => void) | null;

    devId: number;
    currentTrigger: any; // Tracks current trigger function processing
    intentMap: { [id: string]: any }; 
    chatHistory: GenoMessage[];
    isListening: boolean;
    isCollapsed: boolean;

    // HTML Elements
    box: HTMLDivElement | undefined;
    currentMessage: HTMLDivElement | undefined;
    bubble: HTMLDivElement | undefined;
    listeningIndicator: HTMLDivElement | undefined;
    micButton: HTMLInputElement | undefined;

    borderTimer: number | undefined;
    listeningTimer: number | undefined;

    recognition: SpeechRecognition | undefined;

    constructor() {
        this.devId = -1;
        this.onfinalmessage = null;
        this.intentMap = {};
        this.chatHistory = [];
        this.isListening = false;
        this.isCollapsed = true;
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

    /*** Listening Functions ***/

    /** Adds a new message to the chat history */
    addChatMessage(text: string, who: string): GenoMessage | null {
        if (text != "..." && text != "") {
            var message = { text: text, who: who };
            this.chatHistory.push(message);
            if (who === "user") {
                this.bubble.textContent = text;
                this.bubble.className = "geno-last-phrase";
            }
            return message;
        }
        return null;
    }

    /** Configure developer ID */
    setDevId(devId: number) {
        this.devId = devId;
    }

    /** Convenient method to initialize Geno */
    start(devId: number) {
        this.addPopover();
        this.setDevId(devId);
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
                // TODO: check for matches with queries and show suggestion
                this.bubble.className = "geno-suggest";
                this.bubble.style.visibility = "visible";

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
    }

    /** Stop any listening action */
    stopListening() {
        if (!this.isListening || !this.recognition) return;

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
                    this.triggerFunction(message.text);
                }
            }
        }

        this.micButton.disabled = false;
    }

    /*** Control Functions ***/
    
    /** Execute appropriate function based on match to query */
    triggerFunction(query: string) {
        if (typeof query != "string") return;
        if (this.devId == -1) {
            console.warn("You need to set your developer ID using geno.configure(DEV_ID)");
            return;
        }

        var xhr = new XMLHttpRequest();
        var url = "http://localhost:3001/response?dev_id=" + encodeURIComponent(this.devId) + "&query=" + encodeURIComponent(query);
        xhr.open('GET', url);

        xhr.onload = () => {
            console.log(json);
            var json = JSON.parse(xhr.responseText);
            var confidence = json.intent.confidence;
            var info = this.intentMap[json.intent.name];

            if (Object.keys(this.intentMap).length == 1) {
                info = Object.values(this.intentMap)[0]; // Only intent so get it
            }

            if (info && (json.intent_ranking.length == 0 || confidence > 0.50)) {
                if (info.type === "demo") {
                    this.clickElements(info.elements, json.entities, info.parameters, info.delay * 1000);
                } else if (info.type === "function") {
                    this.currentTrigger = {
                        query: query,
                        info: info,
                        entities: json.entities,
                        args: [],
                        expectedArgs: Object.keys(info.parameters) // Always in correct call order
                    };
                    this.retrieveArgs();
                }
            } else {
                console.log(json);
                this.respond("Sorry, I didn't understand.");
                this.setBorderColor(GenoState.Error);
            }
        };

        xhr.send();
    }

    getSelectionText() {
        var text = null;
        // TODO: set to null if nothing selected
        if (window.getSelection) {
            text = window.getSelection().toString();
        }
        return text;
    }

    /** A recursive/callback based function to retrieve all arguments and trigger function */
    retrieveArgs() {
        var expectedArgs = this.currentTrigger.expectedArgs;

        // All arguments retrieved already, trigger function
        if (expectedArgs.length == this.currentTrigger.args.length) {
            import("../" + this.currentTrigger.info.file)
                .then((module) => {
                    var fn = module[this.currentTrigger.info.triggerFn];
                    if (fn) {
                        var result = module[this.currentTrigger.info.triggerFn].apply(null, this.currentTrigger.args);
                        console.log(result);
                    } else {
                        console.error("Error: Could not find function '" + this.currentTrigger.info.triggerFn + "' in module '" + this.currentTrigger.info.file) + "'";
                    }
                    this.currentTrigger = null;
                });
            return;
        }

        // Retrieve arguments
        for (let index = this.currentTrigger.args.length; index < expectedArgs.length; index++) {
            var arg = expectedArgs[index];
            var entity = this.currentTrigger.entities.find((e: any) => e.entity === arg);
            var value = null;

            if (entity === undefined) {
                var backupQuestion = this.currentTrigger.info.parameters[arg];

                // Default backup question in case developer hasn't provided
                if (backupQuestion === "") {
                    backupQuestion = "What is " + arg + "?";
                }

                this.ask(backupQuestion, true, (answer) => {
                    this.onfinalmessage = null;
                    console.log("Received value for " + arg + ", " + answer.text);
                    this.addArg(answer.text);
                    this.retrieveArgs();
                });
                return;
            } else {
                value = this.currentTrigger.query.slice(entity.start, entity.end);
                // var value = entity['value']; // TODO: Use this instead of the slice below
            }
            this.addArg(value);
        }
        this.retrieveArgs();
    }

    /** Recursive function to simulate clicks for demo command */
    clickElements(elements: any[], entities: any[], parameters: any[], delay: number, i: number = 0) {
        if (i >= elements.length) { return; }

        var el = document.getElementsByTagName(elements[i].tag)[elements[i].index]
        el.click();

        // TODO: WE NEED TO TEST THIS!!!
        // Handling for if this step in sequence is associated with a parameter input
        var arg = parameters.find((p: any) => p.index === i);
        if (arg) {
            var entity = entities.find((e: any) => e.entity === arg.name);
            if (entity === undefined) {
                var backupQuestion = arg.backupQuery;

                // Default backup question in case developer hasn't provided
                if (backupQuestion === "") {
                    backupQuestion = "What is " + arg + "?";
                }

                this.ask(backupQuestion, true, (answer) => {
                    this.onfinalmessage = null;
                    console.log("Received value for " + arg.name + ", " + answer.text);
                    el.value = entity.value
                    setTimeout(() => {
                        this.clickElements(elements, entities, parameters, delay, i + 1);
                    }, delay);
                });
                return;
            } else {
                //TODO: Don't know if entity.value is actually a thing :/
                el.value = entity.value
            }
        }

        setTimeout(() => {
            this.clickElements(elements, entities, parameters, delay, i + 1);
        }, delay);
    }
    
    /** Intelligently convert argument to type and add to arguments list */
    addArg(value: any) {
        if (!isNaN(parseInt(value))) {
            value = parseInt(value);
        }
        this.currentTrigger.args.push(value);
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
        bubble.textContent = "Start speaking for suggestions";
        document.body.appendChild(bubble);

        this.box = popover;
        this.currentMessage = genoCurr;
        this.listeningIndicator = genoIndicator;
        this.micButton = <HTMLInputElement>genoMic;
        this.bubble = bubble;

        this.initRecognition();
    }

    /** Hide/show popover */
    togglePopover() {
        if (this.isCollapsed) {
            this.box.style.right = "10px";
            this.bubble.style.visibility = "visible";
            this.bubble.className = "geno-suggest";
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