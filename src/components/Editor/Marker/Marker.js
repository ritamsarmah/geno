import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import database from '../../../Database';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class Marker extends Component {
    constructor(props) {
        super(props);

        // Fill marker if voice command for the function already exists
        var command = database.findCommand(this.props.file, this.props.triggerFn);

        // TODO: check for updates to parameters list, etc.

        this.state = {
            command: command
        };
        this.onClick = this.onClick.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
    }

    onClick() {
        if (this.state.command == null) {
            var command = database.addCommand(this.props.file, this.props.triggerFn, this.props.params);
            console.log("created command", command);
            this.setState({ command: command });
        }
    }

    handlePopoverUnmount() {
        this.setState({
            command: null,
            isVisible: false,
        });
    }

    render() {
        var content = (this.state.command != null) ? (<Popover command={this.state.command} unmountMe={this.handlePopoverUnmount}/>) : (<span></span>)
        var fillClass = (this.state.command != null) ? "filledMarker" : "emptyMarker";
        return (
            <Tippy content={content} arrow={true} trigger="click" placement="right-end" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.isVisible}>
                <div className={fillClass} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


