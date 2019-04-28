import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faChevronLeft, faChevronRight, faPlay, faMousePointer } from '@fortawesome/free-solid-svg-icons';

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
    }

    componentDidMount() {
        this.preview = document.getElementById("preview");
        this.preview.addEventListener("did-navigate", this.syncAddress);
        this.preview.addEventListener("did-navigate-in-page", this.syncAddress);
    }

    /* Sync address bar and state when webview load */
    syncAddress(event) {
        this.changeAddressBar(event.url);
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

    render() {
        return (
            <div>
                <div className="buttons">
                    <button title="Build and Run" className="previewBtn" onClick={this.buildApp}><FontAwesomeIcon icon={faPlay} size="lg" color={Colors.Theme}></FontAwesomeIcon></button>
                    <button title="Go Back" className="previewBtn" onClick={this.goBack}><FontAwesomeIcon icon={faChevronLeft} size="lg"></FontAwesomeIcon></button>
                    <button title="Go Forward" className="previewBtn" onClick={this.goForward}><FontAwesomeIcon icon={faChevronRight} size="lg" disabled></FontAwesomeIcon></button>
                    <button title="Reload" className="previewBtn" onClick={this.reloadPreview}><FontAwesomeIcon icon={faRedoAlt} size="lg"></FontAwesomeIcon></button>
                    <input id="addressBar" value={this.state.address} onChange={(event) => this.changeAddressBar(event.target.value)} onKeyPress={event => {
                        if (event.key === 'Enter') {
                            this.navigate();
                            event.target.blur();
                        }
                    }}></input>
                    <button title="Record Command by Demo" className="previewBtn"><FontAwesomeIcon icon={faMousePointer} size="lg"></FontAwesomeIcon></button>
                </div>
                <webview id="preview" src={this.state.src} autosize="on"></webview>
            </div>
        );
    }
}