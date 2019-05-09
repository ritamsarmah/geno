const { ipcRenderer } = require('electron')

ipcRenderer.on('recordMouseEvents', () => {
    document.body.onclick = recordMouseEvents;
})

function recordMouseEvents(event) {
    var list = getEventListeners(event.target);
    console.log(list["click"][0]["listener"].toString())
    ipcRenderer.sendToHost("mouseEvent", event);
    document.body.onmousedown = null;
}