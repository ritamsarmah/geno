import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import database from '../../../common/Database';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class Marker extends Component {
    constructor(props) {
        super(props);

        var command = null;
        if (this.props.command != null) {
            // Use command passed in directly as prop
            command = this.props.command;
        } else { // Generate command information from editor info
            // Fill marker if voice command for the function already exists
            command = database.findCommand(this.props.file, this.props.triggerFn);

            // Check for changes to parameters list
            if (command != null &&
                JSON.stringify(this.props.params.sort()) !== JSON.stringify(command.parameters.map(p => p.name).sort())) {
                database.updateParameters(command.id, this.props.params);
            }
        }
        
        this.state = {
            command: command,
        };

        this.placement = this.props.placement == null ? "right-end" : this.props.placement;

        this.onClick = this.onClick.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
    }

    onClick() {
        // Used for creation of new commands in editor
        if (this.state.command == null) {
            var command = database.addCommand(this.props.file, this.props.triggerFn, this.props.params);
            this.setState({ command: command });
        }
    }

    handlePopoverUnmount() {
        this.setState({
            command: null,
        });
        document.body.click(); // Really hacky way to dismiss the popover
    }

    renderTippyContent() {
        return (this.state.command != null) ? (<Popover command={this.state.command} unmountMe={this.handlePopoverUnmount} />) : "";
    }

    render() {
        var fillClass = (this.state.command != null) ? "filledMarker" : "emptyMarker";
        return (
            <Tippy content={this.renderTippyContent()}
                arrow={true}
                trigger="click"
                placement={this.placement}
                theme="light-border"
                animation="scale"
                inertia={true}
                interactive={true}>
                <div className={fillClass} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


