import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faChevronLeft, faChevronRight, faPlay, faMousePointer, faCode } from '@fortawesome/free-solid-svg-icons';

import { Colors } from '../../common/constants';
import './Preview.css'
import builder from '../../common/Builder';

const electron = window.require('electron');
const app = electron.remote.app;

export default class Preview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            address: `file://${app.getAppPath()}/src/components/Preview/preview.html`,
            src: `file://${app.getAppPath()}/src/components/Preview/preview.html`
        }

        this.syncAddress = this.syncAddress.bind(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.changeAddressBar = this.changeAddressBar.bind(this);
        this.goBack = this.goBack.bind(this);
        this.goForward = this.goForward.bind(this);
        this.reloadPreview = this.reloadPreview.bind(this);
        this.openDevTools = this.openDevTools.bind(this);
        this.buildApp = this.buildApp.bind(this);
        this.recordMouseEvents = this.recordMouseEvents.bind(this);
    }

    componentDidMount() {
        this.preview = document.getElementById("preview");
        this.preview.addEventListener("did-navigate", this.syncAddress);
        this.preview.addEventListener("did-navigate-in-page", this.syncAddress);
        this.preview.addEventListener('permissionrequest', e => {
            if (e.permission === 'media') {
                e.request.allow();
            }
        });

        this.preview.addEventListener('ipc-message', (event) => {
            if (event.channel === "mouseEvent") {
                this.receivedMouseEvent(event.args[0]);
            }
        })

        // TODO: might use event listener for "console-message"
    }

    /* Sync address bar and state when webview load */
    syncAddress(event) {
        if (event != undefined) {
            this.changeAddressBar(event.url);
        }
    }

    /* Change webview src */
    changeSrc(newSrc) {
        this.setState({ src: newSrc });
    }

    /* Change url in address bar */
    changeAddressBar(src) {
        this.setState({ address: src });
    }

    /* Navigate back in webview*/
    goBack() {
        this.preview.goBack();
        this.setState({ address: this.preview.src })
    }

    /* Navigate forward in webview */
    goForward() {
        this.preview.goForward();
        this.setState({ address: this.preview.src })
    }

    /* Navigate to new page in webview */
    navigate() {
        this.setState({ src: this.state.address });
    }

    /* Reload webview */
    reloadPreview() {
        this.preview.reload();
    }

    /* Open Dev Tools for Preview */
    openDevTools() {
        this.preview.isDevToolsOpened() ? this.preview.closeDevTools() : this.preview.openDevTools();
    }

    /* Turn command data into JavaScript to inject into user's web app */
    buildApp(event) {
        builder.build();
        this.reloadPreview();
    }

    /* Tell webview to start recording mouse events */
    recordMouseEvents() {
        this.preview.send('recordMouseEvents');
    }

    /* Listener triggered after receiving ipc message from preview webview */
    receivedMouseEvent(event) {
        //TODO
        console.log(event);
    }

    render() {
        return (
            <div>
                <div className="buttons">
                    <button title="Build and Run" className="previewBtn" onClick={this.buildApp}><FontAwesomeIcon icon={faPlay} size="lg" color={Colors.Theme}></FontAwesomeIcon></button>
                    <button title="Go Back" className="previewBtn" onClick={this.goBack}><FontAwesomeIcon icon={faChevronLeft} size="lg"></FontAwesomeIcon></button>
                    <button title="Go Forward" className="previewBtn" onClick={this.goForward}><FontAwesomeIcon icon={faChevronRight} size="lg" disabled></FontAwesomeIcon></button>
                    <button title="Reload" className="previewBtn" onClick={this.reloadPreview}><FontAwesomeIcon icon={faRedoAlt} size="lg"></FontAwesomeIcon></button>
                    <input id="addressBar" value={this.state.address} placeholder={"Enter URL here"} onFocus={(event) => event.target.select()} onChange={(event) => this.changeAddressBar(event.target.value)} onKeyPress={event => {
                        if (event.key === 'Enter') {
                            this.navigate();
                            event.target.blur();
                        }
                    }}></input>
                    <button title="Toggle Developer Tools" className="previewBtn" onClick={this.openDevTools}><FontAwesomeIcon icon={faCode} size="lg"></FontAwesomeIcon></button>
                    <button title="Record Command by Demo" className="previewBtn" onClick={this.recordMouseEvents}><FontAwesomeIcon icon={faMousePointer} size="lg"></FontAwesomeIcon></button>
                </div>
                <webview id="preview" src={this.state.src} autosize="on" preload={`file://${app.getAppPath()}/src/components/Preview/inject.js`}></webview>
            </div>
        );
    }
}