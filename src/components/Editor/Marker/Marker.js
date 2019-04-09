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
    name: "",
    triggers: [],
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
        var commandExists = this.props.triggerFns.reduce((sum, f) => sum || (f in markerMap), true);
        this.state = { filled: commandExists }; 
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        if (!this.state.filled) {
            this.setState({ filled: true });
            this.props.triggerFns.forEach(f => {
                markerMap[f] = true;
            });
            // TODO: Generate voice command if doesn't exist already
        }
    }

    render() {
        return (
            <Tippy content={<Popover triggerFns={this.props.triggerFns} params={this.props.params}/>} arrow={true} trigger="click" placement="right" theme="light-border" animation="scale" inertia={true} interactive={true}>
                <div className={this.state.filled ? "filledMarker" : "emptyMarker"} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


