import React, { Component } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Marker } from "../../../Editor/Marker/Marker";

import './CommandItem.css';

const path = require('path');

export default class CommandItem extends Component {
    render() {
        return (
            <div className="cmdItem">
                <p className="cmdName">{this.props.command.name}</p>
                <span className="cmdMarker">
                    <Marker file={this.props.command.file} triggerFn={this.props.command.triggerFn} params={this.props.command.parameters} />
                </span>
                <p className="cmdPath"> {path.basename(this.props.command.file)}</p>
                <span className="fn">{this.props.command.triggerFn}</span>
                <div className="deleteBtn" onClick={() => this.props.delete(this.props.command.id)}>
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                </div>
            </div>
        );
    }
}