const { ipcRenderer } = require('electron')

var clickedElements = [];
var parameters = [];            // Generate indices for text input elements to create parameters

ipcRenderer.on('recordEvents', () => {
    document.onclick = recordEvents;
    // TODO: Add oncontextmenu
    highlightElements();
    console.log("Geno: Recording events");
});

ipcRenderer.on('stopRecordingEvents', () => {
    document.onclick = null;
    console.log("Geno: Stopped recording events");
    console.log("Geno: Detected " + clickedElements.length + " clicks");
    stopHighlightElements();
    ipcRenderer.sendToHost("recordingDone", {
        elements: clickedElements,
        parameters: parameters
    });
});

function recordEvents(e) {
    isRecordingMouseEvents = true;

    var clickedElement = (window.event)
        ? window.event.srcElement
        : e.target;
    var tags = document.getElementsByTagName(clickedElement.tagName);

    for (var i = 0; i < tags.length; ++i) {
        if (tags[i] == clickedElement) {
            clickedElements.push({ tag: clickedElement.tagName, index: i });
            ipcRenderer.sendToHost("clickEvent", {
                tagName: clickedElement.tagName,
                className: clickedElement.className.toString(),
                numClicks: clickedElements.length
            });

            // If the element allows for typing, we can create a parameter for voice input
            if (clickedElement.tagName === "TEXTAREA"
                || (clickedElement.tagName === "INPUT" && /^(?:text|email|number|search|tel|url|password)$/i.test(el.type))
                || (clickedElement.isContentEditable)) {
                window.addEventListener("keypress", keyPressListener);
            } else {
                window.removeEventListener("keypress", keyPressListener);
            }
        }
    }
}

function keyPressListener() {
    parameters.push(clickedElements.length - 1);
    window.removeEventListener("keypress", keyPressListener);
}

/* UI Highlighting Functions */

function highlightListener(e) {
    ipcRenderer.sendToHost("hoverEvent", { tag: e.target.tagName });
    applyMask(e.target);
}

function mouseOutListener(e) {
    clearMasks();
}

function applyMask(target) {
    if (document.getElementsByClassName('highlight-wrap').length > 0) {
        resizeMask(target);
    } else {
        createMask(target);
    }
}

function resizeMask(target) {
    var rect = target.getBoundingClientRect();
    var hObj = document.getElementsByClassName('highlight-wrap')[0];
    hObj.style.top = rect.top + "px";
    hObj.style.width = rect.width + "px";
    hObj.style.height = rect.height + "px";
    hObj.style.left = rect.left + "px";
}

function createMask(target) {
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

function clearMasks() {
    var hwrappersLength = document.getElementsByClassName("highlight-wrap").length;
    var hwrappers = document.getElementsByClassName("highlight-wrap");
    if (hwrappersLength > 0) {
        for (var i = 0; i < hwrappersLength; i++) {
            hwrappers[i].remove();
        }
    }
}

function highlightElements() {
    window.addEventListener('mouseover', highlightListener);
    window.addEventListener('mouseout', mouseOutListener);
}

function stopHighlightElements() {
    window.removeEventListener('mouseover', highlightListener);
    window.removeEventListener('mouseout', mouseOutListener);
}