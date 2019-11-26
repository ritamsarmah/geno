import React, { Component } from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';

import database from '../../../common/Database';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class Marker extends Component {
    constructor(props) {
        super(props);

        // Fill marker if voice command for the function already exists
        var command = database.findCommand(this.props.file, this.props.triggerFn);

        // Check for changes to parameters list
        if (command != null &&
            JSON.stringify(this.props.params.sort()) !== JSON.stringify(command.parameters.map(p => p.name).sort())) {
            database.updateParameters(command.id, this.props.params);
        }

        this.state = {
            command: command
        };
        this.onClick = this.onClick.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
    }

    onClick() {
        if (this.state.command == null) {
            var command = database.addCommand(this.props.file, this.props.triggerFn, this.props.params);

            this.setState({ command: command });
        }
        
        // Case to enable popover visibility after deleting
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
            <Tippy content={content} arrow={true} trigger="click" placement="right-end" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.isVisible}>
                <div className={fillClass} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


