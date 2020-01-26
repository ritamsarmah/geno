const { ipcRenderer } = require('electron')

var clickedElements = [];

ipcRenderer.on('recordMouseEvents', () => {
    document.onclick = recordMouseEvents;
    console.log("Geno: Recording mouse events");
});

ipcRenderer.on('stopRecordingMouseEvents', () => {
    document.onclick = null;
    console.log("Geno: Stopped recording mouse events");
    console.log("Geno: Detected " + clickedElements.length + " clicks");
    ipcRenderer.sendToHost("mouseEvent", { elements: clickedElements });
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
        }
    }
}