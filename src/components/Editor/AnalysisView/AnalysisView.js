import React, { Component } from 'react';

import "./AnalysisView.css"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';

export default class AnalysisView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            query: this.props.query
        }
        this.dismiss = this.dismiss.bind(this);
        this.delete = this.delete.bind(this);
        this.onQueryChange = this.onQueryChange.bind(this);
    }

    onQueryChange() {
        var nlpContent = document.getElementById("nlpContent");
        this.state.query.query = nlpContent.value
    }

    dismiss() {
        // Pass any updates to query on dismiss
        this.props.unmountMe(this.state.query);
    } 

    delete() {
        this.props.deleteQuery(this.state.query);
        this.dismiss();
    }

    render() {
        return (
            <div id="analysisView">
                <div className="close" onClick={this.dismiss}>
                    <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                </div>
                <div className="delete" onClick={this.delete}>
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                </div>
                <input id="nlpContent" type="text" defaultValue={this.state.query.query} onChange={this.onQueryChange}></input>
            </div>
        )
    }
}
