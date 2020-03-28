import React, { Component } from 'react';
import DemoPopover from '../Editor/Popover/DemoPopover';
import Tippy from '@tippy.js/react';
import { Colors, GenoEvent } from '../../common/constants';
import './Preview.css'
import 'tippy.js/themes/light-border.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faChevronLeft, faChevronRight, faMousePointer, faCode, faStop, faTimesCircle, faHammer } from '@fortawesome/free-solid-svg-icons';

import builder from '../../common/Builder';
import database from '../../common/Database';
import emitter from '../../common/Emitter';

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
            // src: `file://${app.getAppPath()}/src/components/Preview/preview.html`,
            address: "http://localhost:9000/examples/full.html",
            src: "http://localhost:9000/examples/full.html",
            recordState: this.STOPPED,
            demoCommand: null
        }

        this.syncAddress = this.syncAddress.bind(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.changeAddressBar = this.changeAddressBar.bind(this);
        this.goBack = this.goBack.bind(this);
        this.goForward = this.goForward.bind(this);
        this.reloadPreview = this.reloadPreview.bind(this);
        this.openDevTools = this.openDevTools.bind(this);
        this.buildApp = this.buildApp.bind(this);
        this.recordEvents = this.recordEvents.bind(this);
        this.createDemoCommand = this.createDemoCommand.bind(this);
        this.trackContext = this.trackContext.bind(this);
        this.stopTrackingContext = this.stopTrackingContext.bind(this);
        this.shareContextWithPopover = this.shareContextWithPopover.bind(this);
        this.stopRecordEvents = this.stopRecordEvents.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
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
            if (event.channel === "clickEvent") {
                this.receivedMouseEvent(event.args[0]);
            } else if (event.channel === "hoverEvent") {
                this.receivedHoverEvent(event.args[0]);
            } else if (event.channel === "recordingDone") {
                this.createDemoCommand(event.args[0]);
            } else if (event.channel === "trackedContext") {
                this.shareContextWithPopover(event.args[0]);
            }
        });

        emitter.on(GenoEvent.TrackContext, this.trackContext);
        emitter.on(GenoEvent.StopTrackContext, this.stopTrackingContext);

        // NOTE: Could use event listener for "console-message" to display some info
    }

    componentWillUnmount() {
        emitter.removeListener(GenoEvent.TrackContext, this.trackContext);
        emitter.removeListener(GenoEvent.StopTrackContext, this.stopTrackingContext);
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
        this.stopRecordEvents();
        this.preview.goBack();
        this.setState({ address: this.preview.src })
    }

    /* Navigate forward in webview */
    goForward() {
        this.stopRecordEvents();
        this.preview.goForward();
        this.setState({ address: this.preview.src })
    }

    /* Navigate to new page in webview */
    navigate() {
        this.stopRecordEvents();
        if (this.state.address === "") {
            this.setState({ src: `file://${app.getAppPath()}/src/components/Preview/preview.html` })
        } else if (!this.state.address.startsWith("http") && !this.state.address.startsWith("file://")) {
            this.setState((state, _props) => ({ address: `http://${state.address}` }), () => {
                this.setState((state, _props) => ({ src: state.address }));
            });
        } else {
            this.setState((state, _props) => ({ src: state.address }));
        }
    }

    /* Reload webview */
    reloadPreview() {
        this.stopRecordEvents();
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
    recordEvents() {
        this.setState({
            numClicks: 0,
            currentTag: "None",
            recordState: this.RECORDING
        });
        this.preview.send('recordEvents');
    }

    /* Tell webview to stop recording mouse events */
    stopRecordEvents() {
        if (this.state.recordState !== this.STOPPED) {
            this.preview.send('stopRecordingEvents');
            this.setState({ demoMessage: null });
        }
    }

    /* Listener triggered after receiving clickEvent ipc message from preview webview */
    receivedMouseEvent(event) {
        var selector = event.tagName.toLowerCase();
        if (event.className != null && event.className !== "") {
            selector += "." + event.className.replace(' ', '.');
        }

        if (event.isClickable) {
            this.setState({
                demoMessage: `Clicked ${selector}`,
                numClicks: event.numClicks
            });
        } else {
            this.setState({
                demoMessage: `Ignoring non-clickable ${selector}`,
            });
        }
        
    }

    /* Listener triggered after receiving hoverEvent ipc message from preview webview */
    receivedHoverEvent(event) {
        this.setState({
            currentTag: event.tag.toLowerCase(),
        });
    }

    /* Listener triggered after receiving recordingDone ipc message from preview webview */
    createDemoCommand(event) {
        var elements = event.elements;
        var parameters = event.parameters;
        if (elements.length === 0) {
            // No elements clicked so don't create any voice command
            this.setState({ recordState: this.STOPPED });
        } else {
            this.setState({
                demoCommand: database.addDemoCommand(elements, parameters, this.state.address.split('/').pop()),
                recordState: this.POPOVER
            });
        }
    }

    trackContext() {
        this.preview.send('trackContext');
    }

    stopTrackingContext() {
        this.preview.send('stopTrackingContext');
    }

    shareContextWithPopover(event) {
        emitter.emit(GenoEvent.ShareContext, event.contexts[0]);
    }

    getRecordOnClick() {
        switch (this.state.recordState) {
            case this.STOPPED:
                return this.recordEvents;
            case this.RECORDING:
                return this.stopRecordEvents;
            case this.POPOVER:
                return this.handlePopoverUnmount;
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

    handlePopoverUnmount() {
        this.setState({
            demoCommand: null,
            recordState: this.STOPPED
        });
    }

    render() {
        var addressBar = !(this.state.recordState === this.RECORDING)
            ? (
                <input id="addressBar" className="pill" value={this.state.address} placeholder={"Enter URL here"} onFocus={(event) => event.target.select()} onChange={(event) => this.changeAddressBar(event.target.value)} onKeyPress={event => {
                    if (event.key === 'Enter') {
                        this.navigate();
                        event.target.blur();
                    }
                }}></input>
            )
            : (
                <p id="recordTutorial">{this.state.demoMessage != null ? this.state.demoMessage : "Click a UI element to start recording a command"}</p>
            );

        var content = (this.state.demoCommand != null) ? (<DemoPopover command={this.state.demoCommand} flipSide={true} unmountMe={this.handlePopoverUnmount} />) : (<span></span>);

        var buttons = (this.state.recordState === this.RECORDING)
            ? (
                <div className="buttons">
                    {addressBar}
                    <div className="pill">{this.state.currentTag}</div>
                    <div className="pill">{this.state.numClicks + (this.state.numClicks === 1 ? " click" : " clicks")}</div>
                    <button title="Toggle Developer Tools" className="previewBtn" onClick={this.openDevTools}><FontAwesomeIcon icon={faCode} size="lg"></FontAwesomeIcon></button>
                    <Tippy content={content} arrow={true} trigger="click" placement="bottom" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.recordState === this.POPOVER}>
                        <button title="Create Demo Command" className="previewBtn" onClick={this.getRecordOnClick()}>
                            {this.getRecordIcon()}
                        </button>
                    </Tippy>
                </div>
            )
            : (
                <div className="buttons">
                    <button title="Build and Run" className="previewBtn" onClick={this.buildApp}><FontAwesomeIcon icon={faHammer} size="lg" color={Colors.Theme}></FontAwesomeIcon></button>
                    <button title="Go Back" className="previewBtn" onClick={this.goBack}><FontAwesomeIcon icon={faChevronLeft} size="lg"></FontAwesomeIcon></button>
                    <button title="Go Forward" className="previewBtn" onClick={this.goForward}><FontAwesomeIcon icon={faChevronRight} size="lg" disabled></FontAwesomeIcon></button>
                    <button title="Reload" className="previewBtn" onClick={this.reloadPreview}><FontAwesomeIcon icon={faRedoAlt} size="lg"></FontAwesomeIcon></button>
                    {addressBar}
                    <button title="Toggle Developer Tools" className="previewBtn" onClick={this.openDevTools}><FontAwesomeIcon icon={faCode} size="lg"></FontAwesomeIcon></button>
                    <Tippy content={content} arrow={true} trigger="click" placement="bottom" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.recordState === this.POPOVER}>
                        <button title="Create Command for Button" className="previewBtn" onClick={this.getRecordOnClick()}>
                            {this.getRecordIcon()}
                        </button>
                    </Tippy>
                </div>
            );
        return (
            <div>
                {buttons}
                <webview id="preview" src={this.state.src} autosize="on" preload={`file://${app.getAppPath()}/src/components/Preview/inject.js`}></webview>
            </div>
        );
    }
}