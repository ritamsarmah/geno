import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

// TODO: Need to move to a JSON file for saving
// Or save to a JSON file when save is clicked
/*
Example Format:
var sample = {
    id: "", // auto generate random id
    name: "",
    triggerFn: "",
    filePath: "", // file location of function
    queries: [
        {
            query: "Remove all events named Lunch with Boss"
            {
                NLP storage of parameter/words mapping
            }
        }
    ],
    completionVoiceResponse: null,
    paramOptions: [
        {
            param: "",
            backupQuery: ""
        }
    ]
}
*/
var markerMap = {}


export default class Marker extends Component {
    // TODO: add id function that maps marker to a function/voice command to retrieve state information from
    constructor(props) {
        super(props);

        // TODO: Set state based on whether or not model contains voice command for the function this marker
        // is mapped to. Also set filled state based on checking model for all triggered functions
        this.state = { filled: (this.props.triggerFn in markerMap) };
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        if (!this.state.filled) {
            this.setState({ filled: true });
            markerMap[this.props.triggerFn] = {
                name: "Untitled Command",
                triggerFn: this.props.triggerFn,
                filePath: "", // file location of function
                params: this.props.params,
                queries: [{
                    query: "Remove all events named Lunch with Boss"
                }, {
                    query: "Delete events named CS 101 Lecture"
                }, {
                    query: "Delete event with title Daily Meeting"
                }, {
                    query: "Delete Weekly sprint"
                }, {
                    query: "Remove all events named Lunch with Boss"
                }, {
                    query: "Delete events named CS 101 Lecture"
                }, {
                    query: "Delete event with title Daily Meeting"
                }, {
                    query: "Delete Weekly sprint"
                }, {
                    query: "Remove all events named Lunch with Boss"
                }, {
                    query: "Delete events named CS 101 Lecture"
                }, {
                    query: "Delete event with title Daily Meeting"
                }, {
                    query: "Delete Weekly sprint"
                }]
            }
        }
    }

    render() {
        var content = (this.props.triggerFn in markerMap) ? (<Popover command={markerMap[this.props.triggerFn]} />) : (<span></span>)
        return (
            <Tippy content={content} arrow={true} trigger="click" placement="right-end" theme="light-border" animation="scale" inertia={true} interactive={true}>
                <div className={this.state.filled ? "filledMarker" : "emptyMarker"} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


