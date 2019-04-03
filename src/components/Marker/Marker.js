import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import { Colors } from '../../constants';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class Marker extends Component {
    // TODO: add id function that maps marker to a function/voice command to retrieve state information from
    constructor(props) {
        super(props);

        // TODO: Set state based on whether or not model contains voice command for the function this marker
        // is mapped to
        this.state = { filled: false };
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        if (!this.state.filled) {
            this.setState({ filled: true });
            // TODO: Generate voice command if doesn't exist already
        }
    }

    render() {
        return (
            <Tippy content={<Popover triggerFns={this.props.triggerFns}/>} arrow={true} trigger="click" placement="right" theme="light-border" animation="scale" inertia={true} interactive={true}>
                <div className={this.state.filled ? "filledMarker" : "emptyMarker"} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


