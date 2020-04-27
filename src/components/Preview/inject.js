const { ipcRenderer } = require('electron')

var clickedElements = [];
var parameters = [];            // Generate indices for text input elements to create parameters
var documentSnapshot;           // Use last snapshot before each recorded interaction cause HTML might change

var contextElement;
var hoverTimer;

ipcRenderer.on('recordEvents', () => {
    documentSnapshot = document.cloneNode(true); 
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
    clickedElements = [];
    parameters = [];
});

/* Record interaction events for programming by demo */
function recordEvents(e) {
    function compareNodes(targetNode, clickedNode) {
        if (targetNode.isEqualNode(clickedNode) || targetNode == clickedNode) {
            var isClickable = (typeof clickedNode.click === "function");
            if (isClickable) {
                clickedElements.push({ tag: clickedNode.tagName, index: i });
            }

            ipcRenderer.sendToHost("clickEvent", {
                tagName: clickedNode.tagName,
                className: clickedNode.className.toString(),
                numClicks: clickedElements.length,
                isClickable: isClickable
            });

            // If the element allows for typing, we can create a parameter for voice input
            if (clickedNode.tagName === "TEXTAREA"
                || (clickedNode.tagName === "INPUT" && /^(?:text|email|number|search|tel|url|password)$/i.test(el.type))
                || (clickedNode.isContentEditable)) {
                window.addEventListener("keypress", keyPressListener);
            } else {
                window.removeEventListener("keypress", keyPressListener);
            }
            return true;
        }
    }

    isRecordingMouseEvents = true;

    var clickedElement = (window.event)
        ? window.event.srcElement
        : e.target;
        
    var tags = documentSnapshot.getElementsByTagName(clickedElement.tagName);
    documentSnapshot = document.cloneNode(true);

    for (var i = 0; i < tags.length; ++i) {
        if (compareNodes(tags[i], clickedElement)) {
            return;
        }
    }

    tags = document.getElementsByTagName(clickedElement.tagName);

    for (var i = 0; i < tags.length; ++i) {
        if (compareNodes(tags[i], clickedElement)) {
            return;
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
    var isClickable = (typeof e.target.click === "function");
    ipcRenderer.sendToHost("hoverEvent", {
        tag: e.target.tagName,
        isClickable: isClickable
    });
    applyMask(e.target, isClickable ? 'skyblue' : 'red');
}

/* Listener to trigger highlight removal */
function mouseOutListener(e) {
    clearMasks();
}

/* Adds highlight to element */
function applyMask(target, color) {
    var masks = document.getElementsByClassName('highlight-wrap');
    if (masks.length > 0) {
        drawMask(masks[0], target, color);
    } else {
        createMask(target, color);
    }
}

/* Creates the highlight for an element */
function createMask(target, color) {
    var canvas = document.createElement('canvas'); //Create a canvas element
    canvas.className = 'highlight-wrap';
    // Set canvas width/height
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Position canvas
    canvas.style.position = 'absolute';
    canvas.style.zIndex = "100000";
    canvas.style.opacity = '0.5';
    canvas.style.cursor = 'default';
    canvas.style.pointerEvents = 'none'; //Make sure you can click 'through' the canvas
    document.body.appendChild(canvas); //Append canvas to body element

    drawMask(canvas, target, color);
}

/* Draw mask */
function drawMask(canvas, target, color) {
    // Set canvas drawing area width/height
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.left = `${window.scrollX}px`;
    canvas.style.top = `${window.scrollY}px`;

    var rect = target.getBoundingClientRect();
    var canvasContext = canvas.getContext('2d');
    canvasContext.rect(rect.x, rect.y, rect.width, rect.height);
    canvasContext.fillStyle = color;
    canvasContext.fill();
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
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown, true);
    document.body.style.setProperty('cursor', 'crosshair', 'important');
});

ipcRenderer.on('stopTrackingContext', () => {
    clearMasks();

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mousedown", onMouseDown, true);
    document.body.style.setProperty('cursor', 'inherit');
});

function extractContextInfo(element) {
    var selector = element.tagName.toLowerCase();
    if (element.hasAttribute("id")) {
        selector = element.id
    } else if (element.classList.length !== 0) {
        selector += "." + Array.from(element.classList)
            .filter(cl => cl !== "highlight-wrap")
            .join(".");
    }

    var attributes = Array.from(element.attributes).map(attr => attr.nodeName)
    var attributeExamples = {}
    attributes.forEach(attr => attributeExamples[attr] = element.getAttribute(attr));
    
    // Add special "attributes"
    attributes.push('innerText');
    attributeExamples['innerText'] = element.innerText;

    return {
        selector: selector,
        attributes: attributes,
        attributeExamples: attributeExamples
    };
}

/** Share context with host */
function shareContext() {
    var contexts = [extractContextInfo(contextElement)];
    Array.from(contextElement.children).forEach(el => contexts.push(extractContextInfo(el)));

    ipcRenderer.sendToHost("trackedContext", {
        contexts: contexts
    });
}

/** Event listener for click events */
function onMouseDown(e) {
    // Cancel click events
    e.stopPropagation();
    e.preventDefault();

    // Complete tracking
    shareContext();
    ipcRenderer.sendToHost("stopTrackingContext");
}

/** event listener for mousemove events */
function onMouseMove(event) {
    clearMasks(contextElement);
    contextElement = selectPointContext({ x: event.clientX, y: event.clientY });
    applyMask(contextElement, 'skyblue');
    shareContext();
}

function selectPointContext(mousePosition) {
    return document.elementFromPoint(mousePosition.x, mousePosition.y);
}