import React, { Component } from 'react';

import "./AnalysisView.css"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';

export default class AnalysisView extends Component {

    constructor(props) {
        super(props);
        this.dismiss = this.dismiss.bind(this);
        this.delete = this.delete.bind(this);
    }

    dismiss() {
        this.props.unmountMe();
    } 

    delete() {
        this.props.deleteQuery(this.props.query);
        this.dismiss();
    }

    render() {
        return (
            <div className="analysisView">
                <div class="close" onClick={this.dismiss}>
                    <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                </div>
                <div class="delete" onClick={this.dismiss}>
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                </div>
                <div className="nlpContent" contentEditable="true">
                    {this.props.query.query}
                </div>
            </div>
        )
    }
}
