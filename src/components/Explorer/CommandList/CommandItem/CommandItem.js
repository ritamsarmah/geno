import React, { Component } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import ListMarker from "../../../Editor/Marker/ListMarker";
import DemoMarker from "../../../Editor/Marker/DemoMarker";

import './CommandItem.css';
import { createCountMessage } from '../../../../common/utils';

const path = require('path');

export default class CommandItem extends Component {

    render() {
        if (this.props.command.type === "demo") {
            return (
                <div className="cmdItem">
                    <p className="cmdName">{this.props.command.name}</p>
                    <span className="cmdMarker">
                        <DemoMarker command={this.props.command} />
                    </span>
                    <p className="cmdPath"> {path.basename(this.props.command.file)} </p>
                    <span className="fn">{createCountMessage(this.props.command.elements.length, "action")}</span>
                    <span className="fn">{createCountMessage(this.props.command.parameters.length, "parameter")}</span>
                    <div className="deleteBtn" onClick={() => this.props.delete(this.props.command.id)}>
                        <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                    </div>
                </div>
            ); 
        } else {
            return (
                <div className="cmdItem">
                    <p className="cmdName">{this.props.command.name}</p>
                    <span className="cmdMarker">
                        <ListMarker file={this.props.command.file} triggerFn={this.props.command.triggerFn} params={this.props.command.parameters.map(p => p.name)} />
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
}