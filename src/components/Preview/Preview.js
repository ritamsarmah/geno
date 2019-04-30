import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faChevronLeft, faChevronRight, faPlay, faMousePointer, faCode } from '@fortawesome/free-solid-svg-icons';

import { Colors } from '../../common/constants';
import './Preview.css'

export default class Preview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            // TODO: change to localhost
            address: "http://google.com",
            src: "http://google.com"
        }

        this.syncAddress = this.syncAddress.bind(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.changeAddressBar = this.changeAddressBar.bind(this);
        this.goBack = this.goBack.bind(this);
        this.goForward = this.goForward.bind(this);
        this.reloadPreview = this.reloadPreview.bind(this);
        this.openDevTools = this.openDevTools.bind(this);
        this.recordMouseEvents = this.recordMouseEvents.bind(this);
    }

    componentDidMount() {
        this.preview = document.getElementById("preview");
        this.preview.addEventListener("did-navigate", this.syncAddress);
        this.preview.addEventListener("did-navigate-in-page", this.syncAddress);
        this.preview.addEventListener('ipc-message', (event) => {
            console.log(event.channel)
            // Prints "pong"
        })
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

    /* Navigate back */
    goBack() {
        this.preview.goBack();
        this.setState({
            address: this.preview.src,
            src: this.preview.src
        })
    }

    /* Navigate forward */
    goForward() {
        this.preview.goForward();
        this.setState({
            address: this.preview.src,
            src: this.preview.src
        })
    }

    /* Navigate to new page */
    navigate() {
        this.setState({
            src: this.state.address
        })
    }

    /* Reload */
    reloadPreview() {
        this.preview.reload();
        this.syncAddress();
    }

    /* Open Dev Tools for Preview */
    openDevTools() {
        this.preview.isDevToolsOpened() ? this.preview.closeDevTools() : this.preview.openDevTools();
    }

    recordMouseEvents() {
        // TODO: execute javacsript, use https://electronjs.org/docs/api/ipc-renderer to communicate
        // TODO: https://stackoverflow.com/questions/46968479/how-to-get-return-value-from-webview-executejavascript-in-electron
        this.preview.send('ping');
    }

    render() {
        return (
            <div>
                <div className="buttons">
                    <button title="Build and Run" className="previewBtn" onClick={this.buildApp}><FontAwesomeIcon icon={faPlay} size="lg" color={Colors.Theme}></FontAwesomeIcon></button>
                    <button title="Go Back" className="previewBtn" onClick={this.goBack}><FontAwesomeIcon icon={faChevronLeft} size="lg"></FontAwesomeIcon></button>
                    <button title="Go Forward" className="previewBtn" onClick={this.goForward}><FontAwesomeIcon icon={faChevronRight} size="lg" disabled></FontAwesomeIcon></button>
                    <button title="Reload" className="previewBtn" onClick={this.reloadPreview}><FontAwesomeIcon icon={faRedoAlt} size="lg"></FontAwesomeIcon></button>
                    <input id="addressBar" value={this.state.address} onFocus={(event) => event.target.select()} onChange={(event) => this.changeAddressBar(event.target.value)} onKeyPress={event => {
                        if (event.key === 'Enter') {
                            this.navigate();
                            event.target.blur();
                        }
                    }}></input>
                    <button title="Toggle Developer Tools" className="previewBtn" onClick={this.openDevTools}><FontAwesomeIcon icon={faCode} size="lg"></FontAwesomeIcon></button>
                    <button title="Record Command by Demo" className="previewBtn" onClick={this.recordMouseEvents}><FontAwesomeIcon icon={faMousePointer} size="lg"></FontAwesomeIcon></button>
                </div>
                <webview id="preview" src={this.state.src} autosize="on" preload={`file://Users/ritamsarmah/Documents/College/Geno/Code/geno/src/components/Preview/inject.js`}></webview>
            </div>
        );
    }
}