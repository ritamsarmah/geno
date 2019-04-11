import React, { Component } from 'react';

import "./AnalysisView.css"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default class AnalysisView extends Component {

    constructor(props) {
        super(props);
        this.dismiss = this.dismiss.bind(this);
    }

    dismiss() {
        this.props.unmountMe();
    } 

    render() {
        return (
            <div className="analysisView">
                <div class="close" onClick={this.dismiss}>
                    <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                </div>
                <div className="nlpContent">
                    {this.props.query.query}
                </div>
            </div>
        )
    }
}
