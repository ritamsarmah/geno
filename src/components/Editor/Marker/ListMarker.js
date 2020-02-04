import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import database from '../../../common/Database';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class ListMarker extends Component {
    constructor(props) {
        super(props);
        // Fill marker if voice command for the function already exists
        var command = database.findCommand(this.props.file, this.props.triggerFn);

        this.state = { command: command };
        this.onClick = this.onClick.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
    }

    onClick() {
        if (!this.state.isVisible) {
            this.setState({ isVisible: null });
        }
    }

    handlePopoverUnmount() {
        this.setState({
            command: null,
            isVisible: false,
        });
    }

    render() {
        var content = (this.state.command != null) ? (<Popover command={this.state.command} unmountMe={this.handlePopoverUnmount} />) : (<span></span>);
        var fillClass = (this.state.command != null) ? "filledMarker" : "emptyMarker";
        return (
            <Tippy content={content} arrow={true} trigger="click" placement="top-end" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.isVisible}>
                <div className={fillClass} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


