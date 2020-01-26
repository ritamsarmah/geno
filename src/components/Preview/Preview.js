import React, { Component } from 'react';
import Tippy from '@tippy.js/react';
import builder from '../../common/Builder';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faChevronLeft, faChevronRight, faPlay, faMousePointer, faCode, faStop, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

import { Colors } from '../../common/constants';
import './Preview.css'
import 'tippy.js/themes/light-border.css';

const electron = window.require('electron');
const app = electron.remote.app;

export default class Preview extends Component {

    // States for programming by demo
    STOPPED = 0;
    RECORDING = 1;
    POPOVER = 2;

    constructor(props) {
        super(props)
        this.state = {
            // address: `file://${app.getAppPath()}/src/components/Preview/preview.html`,
            // src: `file://${app.getAppPath()}/src/components/Preview/preview.html`
            address: "http://127.0.0.1:3301",
            src: "http://127.0.0.1:3301",
            recordState: this.STOPPED
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
        this.stopRecordMouseEvents = this.stopRecordMouseEvents.bind(this);
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
        if (event !== undefined) {
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
        this.setState({ recordState: this.RECORDING });
        this.preview.send('recordMouseEvents');
    }

    /* Tell webview to stop recording mouse events */
    stopRecordMouseEvents() {
        this.preview.send('stopRecordingMouseEvents');
    }

    /* Listener triggered after receiving ipc message from preview webview */
    receivedMouseEvent(event) {
        var elements = event.elements;
        if (elements.length == 0) {
            // No elements clicked so don't create any voice command
            this.setState({ recordState: this.STOPPED });
        } else {
            this.setState({ recordState: this.POPOVER });
            // TODO: show element command popover
        }
    }

    getRecordOnClick() {
        switch (this.state.recordState) {
            case this.STOPPED:
                return this.recordMouseEvents;
            case this.RECORDING:
                return this.stopRecordMouseEvents;
            case this.POPOVER:
                return () => this.setState({ recordState: this.STOPPED });
                break;
            default:
                break;
        }
    }

    getRecordIcon() {
        switch (this.state.recordState) {
            case this.STOPPED:
                return <FontAwesomeIcon icon={faMousePointer} size="lg" ></FontAwesomeIcon>
            case this.RECORDING:
                return <FontAwesomeIcon icon={faStop} size="lg" ></FontAwesomeIcon>
            case this.POPOVER:
                return (
                    <FontAwesomeIcon icon={faTimesCircle} size="lg" >
                    </FontAwesomeIcon>
                );
            default:
                break;
        }
    }

    render() {
        var addressBar = !this.state.isRecordingEvents
            ? addressBar = (
                <input id="addressBar" value={this.state.address} placeholder={"Enter URL here"} onFocus={(event) => event.target.select()} onChange={(event) => this.changeAddressBar(event.target.value)} onKeyPress={event => {
                    if (event.key === 'Enter') {
                        this.navigate();
                        event.target.blur();
                    }
                }}></input>
            )
            : addressBar = (
                <p id="recordTutorial">Record mouse clicks to create a voice command. Press stop button when done. </p>
            );

        // var content = (this.state.command != null) ? (<Popover command={this.state.command} unmountMe={this.handlePopoverUnmount} />) : (<span></span>);

        return (
            <div>
                <div className="buttons">
                    <button title="Build and Run" className="previewBtn" onClick={this.buildApp}><FontAwesomeIcon icon={faPlay} size="lg" color={Colors.Theme}></FontAwesomeIcon></button>
                    <button title="Go Back" className="previewBtn" onClick={this.goBack}><FontAwesomeIcon icon={faChevronLeft} size="lg"></FontAwesomeIcon></button>
                    <button title="Go Forward" className="previewBtn" onClick={this.goForward}><FontAwesomeIcon icon={faChevronRight} size="lg" disabled></FontAwesomeIcon></button>
                    <button title="Reload" className="previewBtn" onClick={this.reloadPreview}><FontAwesomeIcon icon={faRedoAlt} size="lg"></FontAwesomeIcon></button>
                    {addressBar}
                    <button title="Toggle Developer Tools" className="previewBtn" onClick={this.openDevTools}><FontAwesomeIcon icon={faCode} size="lg"></FontAwesomeIcon></button>
                    <Tippy content={<p>"Hello"</p>} arrow={true} trigger="click" placement="bottom" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.recordState == this.POPOVER}>
                        <button title="Create Command for Button" className="previewBtn" onClick={this.getRecordOnClick()}>
                            {this.getRecordIcon()}
                        </button>
                    </Tippy>
                </div>
                <webview id="preview" src={this.state.src} autosize="on" preload={`file://${app.getAppPath()}/src/components/Preview/inject.js`}></webview>
            </div>
        );
    }
}