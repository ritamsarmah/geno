// TODO: Run showGeno() based on if developer selected default popover to be used
addGenoPopover();

function genoRespond(phrase, speak = true, callback = null) {
    // Display phrase as text
    currMsgElement.textContent = phrase;
    updateChatHistory(phrase, "geno");

    // Speak phrase
    if (speak) {
        var utterance = new SpeechSynthesisUtterance(phrase);
        utterance.onend = callback;
        speechSynthesis.speak(utterance);
    }
}

/* Asks a question and listens for a response */
function genoAsk(phrase, speak = true, callback = null) {
    genoRespond(phrase, speak, () => {
        onFinalResult = callback;
        enableGeno();
    });
}

var currentTrigger; /* Used to track current trigger function processing */

/* Execute appropriate function based on match to query */
function triggerFunction(query) {
    if (typeof query != "string") return;
    
    var xhr = new XMLHttpRequest();
    var url = "http://localhost:3001/response?dev_id=" + encodeURIComponent(1) + "&query=" + encodeURIComponent(query);
    xhr.open('GET', url);

    xhr.onload = function () {
        var json = JSON.parse(this.responseText);
        var confidence = json.intent.confidence
        var info = functionIntentMap[json.intent.name];
        var fn = window.functionFromString(info.triggerFn);

        if (typeof fn === 'function' && confidence > 0.70) {
            currentTrigger = {
                query: query,
                info: info,
                fn: fn,
                entities: json.entities,
                args: [],
                expectedArgs: Object.keys(info.parameters) // NOTE: these are in correct order
            };
            retrieveArgs();
        } else {
            genoRespond("Sorry, I didn't understand.");
            changeBorderColor('error');
        }
    };

    xhr.send();
}

/* A recursive/callback based function to retrieve all arguments and trigger function */
function retrieveArgs(expectedArgs) {
    var expectedArgs = currentTrigger.expectedArgs;

    // All arguments retrieved already, trigger function
    if (expectedArgs.length == currentTrigger.args.length) {
        var result = currentTrigger.fn.apply(null, currentTrigger.args);
        console.log(result);
        currentTrigger = null;
        return;
    }

    // Retrieve arguments
    for (let index = currentTrigger.args.length; index < expectedArgs.length; index++) {
        var arg = expectedArgs[index];
        var entity = currentTrigger.entities.find(e => e.entity === arg);
        var value = null;

        if (entity === undefined) {
            var backupQuestion = currentTrigger.info.parameters[arg];

            // Default backup question in case developer hasn't provided
            if (backupQuestion === "") {
                backupQuestion = "What is " + arg + "?";
            }

            genoAsk(backupQuestion, true, (answer) => {
                onFinalResult = null;
                console.log("Received value for " + arg + ", " + answer);
                smartAddArg(answer);
                retrieveArgs();
            });
            return;
        } else {
            value = currentTrigger.query.slice(entity.start, entity.end);
            // var value = entity['value']; // TODO: Use this instead of the slice below
        }
        smartAddArg(value);
    }

    retrieveArgs();
}

function smartAddArg(value) {
    if (!isNaN(parseInt(value))) {
        value = parseInt(value);
    }
    currentTrigger.args.push(value);
}

function functionFromString(string) {
    var scope = window;
    var scopeSplit = string.split('.');
    for (i = 0; i < scopeSplit.length - 1; i++) {
        scope = scope[scopeSplit[i]];

        if (scope == undefined) return;
    }

    return scope[scopeSplit[scopeSplit.length - 1]];
}

/* Constants */
const GENO_DEFAULT_COLOR = "lightgray";
const GENO_SUCCESS_COLOR = "#28CB75";
const GENO_ERROR_COLOR = "#EB503A";
const GENO_THEME_COLOR = '#4A90E2';

// TODO: Refactor so not global variables
var chatHistory = [];

var isCollapsed = true;
var isListening = false;
var timeout = null;

/* HTML elements */
var box = null;
var currMsgElement = null;
var listeningIndicator = null;
var micButton = null;
var bubble = null;

var recognition;
var onFinalResult;

document.addEventListener("DOMContentLoaded", function () {
    box = document.getElementById('geno-ui');
    currMsgElement = document.getElementById('geno-curr');
    listeningIndicator = document.getElementById('geno-indicator');
    micButton = document.getElementById('geno-mic');
    bubble = document.getElementById('geno-bubble');
});

/* UI Handling */

/* Adds Geno popover to body of webpage */
function addGenoPopover() {
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

    var el = document.createElement("div");
    el.id = "geno-bubble";
    el.style.visibility = "hidden";
    el.textContent = "What is the balance in my checking account?"
    document.body.appendChild(el);
}

/* Hide/show popover */
function togglePopover() {
    if (isCollapsed) {
        box.style.right = "10px";
        bubble.style.visibility = "visible";
        bubble.className = "geno-suggest";
        isCollapsed = false;
    }

    isListening ? disableGeno() : enableGeno();
}

/* Hide popover */
function collapsePopover() {
    if (!isCollapsed) {
        box.style.right = "-342px";
        bubble.style.visibility = "hidden"
        isCollapsed = true
    }
    disableGeno();
}

/* Start listening action with UI feedback */
function enableGeno() {
    if (!isListening) {
        listeningIndicator.style.visibility = "visible";
        micButton.style.color = GENO_THEME_COLOR;
        changeBorderColor('listen');
        startListening();
    }
}

/* Stop any listening action with UI feedback */
function disableGeno() {
    if (isListening) {
        listeningIndicator.style.visibility = "hidden";
        micButton.style.color = "black";
        changeBorderColor();
        stopListening();
    }
}

/* Get last message in chat history */
function getLastMessage() {
    var msg = chatHistory.slice(-1)[0];
    return msg ? msg.message : null;
}

/* Adds current message to chat history */
function updateChatHistory(message, who) {
    if (message != "..." && message != "") {
        chatHistory.push({ "message": message, "who": who });
        if (who == "user") {
            bubble.textContent = message;
            bubble.className = "geno-last-phrase";
        }
    }
}

/* Modify UI color based on event type */
function changeBorderColor(alert) {
    clearTimeout(timeout);
    switch (alert) {
        case 'success':
            box.style.borderColor = GENO_SUCCESS_COLOR;
            break;
        case 'error':
            box.style.borderColor = GENO_ERROR_COLOR;
            break;
        case 'listen':
            box.style.borderColor = GENO_THEME_COLOR;
            return;
        default:
            box.style.borderColor = GENO_DEFAULT_COLOR;
            return;
    }

    // Notifcation behavior, go back to default color after 3 seconds
    timeout = setTimeout(changeBorderColor, 3000);
}

/** Speech Commands **/

/* Start listening using SpeechRecognition */
function startListening() {
    isListening = true;
    micButton.disabled = true;

    try {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Intermediate recognition
        recognition.onresult = function (event) {
            currMsgElement.textContent = event.results[0][0].transcript;
            // TODO: check for matches with queries and show suggestion
            bubble.className = "geno-suggest";
            bubble.style.visibility = "visible";
        };

        recognition.onstart = function (s, e) {
            currMsgElement.textContent = "...";
            micButton.disabled = false;
        };

        recognition.start();
    } catch (error) {
        if (error) {
            currMsgElement.textContent = "Browser doesn't support SpeechRecognition";
        }
    }
}

/* Stop listening using SpeechRecognition */
function stopListening() {
    console.log("Stopped listening");
    isListening = false;
    if (recognition) {
        recognition.abort();
        recognition = undefined;

        updateChatHistory(currMsgElement.textContent, "user");

        if (currMsgElement.textContent != "...") {
            var message = getLastMessage();
            if (message) {
                if (onFinalResult) {
                    onFinalResult(message);
                } else {
                    triggerFunction(message);
                }
            }
        }
    }
    micButton.disabled = false;
}