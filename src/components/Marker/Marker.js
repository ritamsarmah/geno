import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import { Colors } from '../../constants';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class Marker extends Component {
    // TODO: add id function that maps marker to a function/voice command to retrieve state information from
    // TODO: Generate voice command if doesn't exist already
    constructor(props) {
        super(props);
        this.state = { filled: false }
        this.onClick = this.onClick.bind(this)
    }

    onClick() {
        if (!this.state.filled) {
            this.setState({filled:true})
        }
    }

    render() {
        return (
            <Tippy content={<Popover />} arrow={true} trigger="click" placement="right" theme="light-border" animation="scale" inertia={true} interactive={true}>
                <div className={this.state.filled ? "filledMarker" : "emptyMarker"} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


