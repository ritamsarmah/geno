// TODO: Run showGeno() based on if developer selected default popover to be used
addGenoPopover();

function genoSpeak(phrase) {
    var synth = speechSynthesis;
    var utterThis = new SpeechSynthesisUtterance(phrase);
    synth.speak(utterThis);
}

/* TODO: (Replace) Execute appropriate function based on match to query */
function triggerFunction(query, ...args) {
    if (typeof query != "string") {
        return;
    }
    for (var k in funcForQuery) {
        if (query.toLowerCase().includes(k.toLowerCase())) {
            console.log("Found function for", k);
            var f = funcForQuery[k];
            var func = window[f.triggerFn];
            console.log(func);
            var res = func(...args);
            console.log(res);
        }
    }
    
    // TODO Need to intelligently parse numbers from number words
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
var lastMsgElement = null;
var currMsgElement = null;
var listeningIndicator = null;
var micButton = null;

var recognition;

document.addEventListener("DOMContentLoaded", function () {
    box = document.getElementById('geno-ui');
    lastMsgElement = document.getElementById('geno-prev');
    currMsgElement = document.getElementById('geno-curr');
    listeningIndicator = document.getElementById('geno-indicator');
    micButton = document.getElementById('geno-mic');

    if (!!window.SpeechSDK) {
        SpeechSDK = window.SpeechSDK;

        // in case we have a function for getting an authorization token, call it.
        if (typeof RequestAuthorizationToken === "function") {
            RequestAuthorizationToken();
        }
    } else {
        micButton.disabled = true;
        micButton.style.pointerEvents = "none";
        micButton.style.color = GENO_ERROR_COLOR;
    }
});

/* UI Handling */

/* Adds Geno popover to body of webpage */
function addGenoPopover() {
    var popover = document.createElement("div");
    popover.id = "geno-ui";
    popover.classList.add("geno-slide-out");
    popover.innerHTML = `
    <div class="geno-chat">
        <div id="geno-prev"></div>
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
}

/* Hide/show popover */
function togglePopover() {
    if (isCollapsed) {
        box.style.right = "10px";
        isCollapsed = false;
    }

    isListening ? disableGeno() : enableGeno();
}

/* Hide popover */
function collapsePopover() {
    if (!isCollapsed) {
        box.style.right = "-342px";
        isCollapsed = true
    }
    disableGeno();
}

/* Start listening action with UI feedback */
function enableGeno() {
    if (!isListening) {
        changeBorderColor('listen');
        startListening();
        listeningIndicator.style.visibility = "visible";
        micButton.style.color = GENO_THEME_COLOR;
    }
}

/* Stop any listening action with UI feedback */
function disableGeno() {
    if (isListening) {
        stopListening();
        listeningIndicator.style.visibility = "hidden";
        micButton.style.color = "black";
        changeBorderColor();
    }
}

/* Adds current message to chat history */
function updateChatHistory() {
    chatHistory.push(currMsgElement.textContent);
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
    currMsgElement.textContent = "...";
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
            console.log(event.results[0][0].transcript);
            currMsgElement.textContent = event.results[0][0].transcript;
        };

        recognition.onstart = function (s, e) {
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
    isListening = false;
    updateChatHistory();
    console.log("Stopped listening")
    if (recognition) {
        recognition.stop();
        recognition = undefined;
        triggerFunction(chatHistory.slice(-1)[0]);
    }
    micButton.disabled = false;
}