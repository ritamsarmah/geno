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

    private currentTrigger: any; // Tracks current trigger function processing
    intentMap: { [id: string]: any }; 
    chatHistory: GenoMessage[];
    isListening: boolean;
    isCollapsed: boolean;

    // HTML Elements
    private box: HTMLDivElement;
    private currentMessage: HTMLDivElement;
    private bubble: HTMLDivElement;
    private listeningIndicator: HTMLDivElement;
    private micButton: HTMLButtonElement;

    private borderTimer: NodeJS.Timeout | undefined;

    private recognition: SpeechRecognition | undefined;

    constructor() {
        this.onfinalmessage = null;
        this.intentMap = {};
        this.chatHistory = [];
        this.isListening = false;
        this.isCollapsed = true;

        this.box = <HTMLDivElement>document.getElementById('geno-ui');
        this.currentMessage = <HTMLDivElement>document.getElementById('geno-curr');
        this.listeningIndicator = <HTMLDivElement>document.getElementById('geno-indicator');
        this.micButton = <HTMLButtonElement>document.getElementById('geno-mic'); // TODO: Not sure if this correct cast
        this.bubble = <HTMLDivElement>document.getElementById('geno-bubble');

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
    private addChatMessage(text: string, who: string): GenoMessage | null {
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

    /** Start listening action using SpeechRecognition */
    private startListening() {
        if (this.isListening || !this.recognition) return;

        this.listeningIndicator.style.visibility = "visible";
        this.micButton.style.color = GenoColor.Theme;
        this.setBorderColor(GenoState.Listening);
        this.micButton.disabled = true;
        this.isListening = true;

        this.recognition.start();
    }

    /** Stop any listening action */
    private stopListening() {
        if (!this.isListening || !this.recognition) return;

        this.recognition.abort();
        this.recognition = undefined;
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

        var xhr = new XMLHttpRequest();
        var url = "http://localhost:3001/response?dev_id=" + encodeURIComponent(1) + "&query=" + encodeURIComponent(query);
        xhr.open('GET', url);

        xhr.onload = () => {
            var json = JSON.parse(xhr.responseText);
            var confidence = json.intent.confidence
            var info = this.intentMap[json.intent.name];
            var fn = this.getFunction(info.triggerFn);

            if (typeof fn === 'function' && confidence > 0.70) {
                this.currentTrigger = {
                    query: query,
                    info: info,
                    fn: fn,
                    entities: json.entities,
                    args: [],
                    expectedArgs: Object.keys(info.parameters) // Always in correct call order
                };
                this.retrieveArgs();
            } else {
                this.respond("Sorry, I didn't understand.");
                this.setBorderColor(GenoState.Error);
            }
        };

        xhr.send();
    }

    /** A recursive/callback based function to retrieve all arguments and trigger function */
    retrieveArgs() {
        var expectedArgs = this.currentTrigger.expectedArgs;

        // All arguments retrieved already, trigger function
        if (expectedArgs.length == this.currentTrigger.args.length) {
            var result = this.currentTrigger.fn.apply(null, this.currentTrigger.args);
            console.log(result);
            this.currentTrigger = null;
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
    
    addArg(value: any) {
        if (!isNaN(parseInt(value))) {
            value = parseInt(value);
        }
        this.currentTrigger.args.push(value);
    }

    getFunction(name: string) {
        var scope: any = window;
        var scopeSplit = name.split('.');
        for (let i = 0; i < scopeSplit.length - 1; i++) {
            scope = scope[scopeSplit[i]];

            if (scope == undefined) return;
        }

        return scope[scopeSplit[scopeSplit.length - 1]];
    }

    /*** UI Functions ***/

    /** Transcribe text to popover */
    private transcribe(text: string) {
        this.currentMessage.textContent = text;
    }

    /** Add Geno popover to body of webpage */
    addPopover() {
        var popover = document.createElement("div");
        popover.id = "geno-ui";
        popover.classList.add("geno-slide-out");
        popover.innerHTML = `
        <div class="geno-chat">
            <div id="geno-curr">
                ...
            </div>
        </div>
        <div class="geno-indicator-box">
            <div class="geno-button-center">
                <div id="geno-indicator" class="la-ball-scale-multiple la-2x">
                    <!-- Empty divs needed for animation -->
                    <div></div>
                    <div></div>
                </div>
                <div id="geno-mic" style="height:30px; width: 20px;" onclick="togglePopover()">
                    <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>
                </div>
            </div>
        </div>
        <div id="geno-close" onclick="collapsePopover()">
            <div style="height: 15px; width: 15px;">
            <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-right" class="svg-inline--fa fa-arrow-right fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path></svg>
        </div>
        `
        document.body.appendChild(popover);

        // Create bubble
        var bubble = document.createElement("div");
        bubble.id = "geno-bubble";
        bubble.style.visibility = "hidden";
        // bubble.textContent = "What is the balance in my checking account?"
        document.body.appendChild(bubble);
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
    private setBorderColor(state: GenoState = GenoState.Ready) {
        if (this.borderTimer) {
            clearTimeout(this.borderTimer);
        }
        switch (state) {
            case GenoState.Listening:
                this.box.style.borderColor = GenoColor.Theme;
                break;
            case GenoState.Success:
                this.box.style.borderColor = GenoColor.Success;
                break;
            case GenoState.Error:
                this.box.style.borderColor = GenoColor.Error;
                break;
            case GenoState.Ready:
                this.box.style.borderColor = GenoColor.Default;
                break;
        }
        this.borderTimer = global.setTimeout(this.setBorderColor, 3000);
    }

}

export var geno = new Geno();
geno.addPopover();