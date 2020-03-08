const { ipcRenderer } = require('electron')

var clickedElements = [];
var parameters = [];            // Generate indices for text input elements to create parameters

var contextElement;
var mouseState = {
    isMouseDown: false,
    selection: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    }
}
var hoverTimer;

ipcRenderer.on('recordEvents', () => {
    document.onclick = recordEvents;
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

/* Record interaction events for programming by demo */
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

/* Listener for key press event */
function keyPressListener() {
    parameters.push(clickedElements.length - 1);
    window.removeEventListener("keypress", keyPressListener);
}

/*** UI Highlighting Functions ***/

/* Highlights element underneath mouse cursor and informs preview */
function highlightListener(e) {
    ipcRenderer.sendToHost("hoverEvent", { tag: e.target.tagName });
    applyMask(e.target);
}

/* Listener to trigger highlight removal */
function mouseOutListener(e) {
    clearMasks();
}

/* Adds highlight to element */
function applyMask(target) {
    if (document.getElementsByClassName('highlight-wrap').length > 0) {
        resizeMask(target);
    } else {
        createMask(target);
    }
}

/* Change size of highlight for element */
function resizeMask(target) {
    var rect = target.getBoundingClientRect();
    var hObj = document.getElementsByClassName('highlight-wrap')[0];
    hObj.style.top = rect.top + "px";
    hObj.style.width = rect.width + "px";
    hObj.style.height = rect.height + "px";
    hObj.style.left = rect.left + "px";
}

/* Creates the highlight for an element */
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

/* Remove highlights */
function clearMasks() {
    var hwrappersLength = document.getElementsByClassName("highlight-wrap").length;
    var hwrappers = document.getElementsByClassName("highlight-wrap");
    if (hwrappersLength > 0) {
        for (var i = 0; i < hwrappersLength; i++) {
            hwrappers[i].remove();
        }
    }
}

/* Adds event listeners for highlighting */
function highlightElements() {
    window.addEventListener('mouseover', highlightListener);
    window.addEventListener('mouseout', mouseOutListener);
}

/* Removes event listeners for highlighting */
function stopHighlightElements() {
    window.removeEventListener('mouseover', highlightListener);
    window.removeEventListener('mouseout', mouseOutListener);
}

/*** Context Tracking ***/

ipcRenderer.on('trackContext', () => {
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});

ipcRenderer.on('stopTrackingContext', () => {
    clearMasks();

    document.removeEventListener("mouseout", onMouseOut);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    shareContext();
});

/** Share context with host */
function shareContext() {
    var selector = "*";
    if (contextElement.getAttributes.hasAttribute("id")) {
        selector = contextElement.id
    } else if (contextElement.classList.length !== 0) {
        selector = contextElement.tagName.toLowerCase() + ".";
        selector += Array.from(contextElement.classList)
            .filter(cl => cl !== "highlight-wrap")
            .join(".");
    }

    var attributes = Array.from(contextElement.attributes).map(attr => attr.nodeName)

    ipcRenderer.sendToHost("trackedContext", {
        selector: selector,
        attributes: attributes
    });
}

/** Event listener for mouseut events */
function onMouseOut(event) {
    clearTimeout(hoverTimer);
}

/** Event listener for mousedown events */
function onMouseDown(event) {
    mouseState.isMouseDown = true;
    clearMasks();
    clearTimeout(hoverTimer);
}

/** event listener for mousemove events */
function onMouseMove(event) {
    if (!mouseState.isMouseDown) {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            clearMasks(contextElement);
            contextElement = selectPointContext({ x: event.clientX, y: event.clientY });
            applyMask(contextElement);
        }, 300);
    }
}

/** Event listener for mouseup events */
function onMouseUp(event) {
    contextElement = null;
    mouseState.isMouseDown = false;
}

function selectPointContext(mousePosition) {
    return document.elementFromPoint(mousePosition.x, mousePosition.y);
}