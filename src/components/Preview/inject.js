const { ipcRenderer } = require('electron')

var clickedElements = [];

ipcRenderer.on('recordMouseEvents', () => {
    document.onclick = recordMouseEvents;
    highlightElements();
    console.log("Geno: Recording mouse events");
});

ipcRenderer.on('stopRecordingMouseEvents', () => {
    document.onclick = null;
    console.log("Geno: Stopped recording mouse events");
    console.log("Geno: Detected " + clickedElements.length + " clicks");
    stopHighlightElements();
    ipcRenderer.sendToHost("recordingDone", { elements: clickedElements });
});

function recordMouseEvents(e) {
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
                className: clickedElement.className,
                numClicks: clickedElements.length
            });
        }
    }
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
    //hObj.style.WebkitTransition='top 0.2s';
    document.body.appendChild(hObj);
}

function clearMasks() {
    var hwrappersLength = document.getElementsByClassName("highlight-wrap").length;
    var hwrappers = document.getElementsByClassName("highlight-wrap");
    if (hwrappersLength > 0) {
        for (var i = 0; i < hwrappersLength; i++) {
            console.log("Removing existing wrap");
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