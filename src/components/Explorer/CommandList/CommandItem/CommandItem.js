import React, { Component } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import './CommandItem.css';

const fs = window.require('fs');

const path = require('path');

export default class CommandItem extends Component {
    render() {
        var fileColor = fs.existsSync(this.props.command.file) ? "lightgray" : "red";
        console.log(this.props.command.file);

        return (
            <div className="cmdItem">
                <p className="cmdName">{this.props.command.name}</p>
                <p className="cmdPath" style={{ color: fileColor }}> {path.basename(this.props.command.file)}</p>
                <span className="fn">{this.props.command.triggerFn}</span>
                <div class="deleteBtn" onClick={() => this.props.delete(this.props.command.id)}>
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                </div>
            </div>
        );
    }
}