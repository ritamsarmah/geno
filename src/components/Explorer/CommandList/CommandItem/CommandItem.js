import React, { Component } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Marker from "../../../Editor/Marker/Marker";
import DemoMarker from "../../../Editor/Marker/DemoMarker";

import './CommandItem.css';
import { createCountMessage } from '../../../../common/utils';

const path = require('path');

export default class CommandItem extends Component {

    renderMarker() {
        if (this.props.command.type === "demo") {
            return <DemoMarker command={this.props.command} placement="top-end"/>;
        } else {
            return <Marker file={this.props.command.file} triggerFn={this.props.command.triggerFn} params={this.props.command.parameters.map(p => p.name)} placement="top-end"/>
        }
    }

    renderSummary() {
        if (this.props.command.type === "demo") {
            return (
                <span>
                    <span className="fn">{createCountMessage(this.props.command.elements.length, "action")}</span >
                    <span className="fn">{createCountMessage(this.props.command.parameters.length, "parameter")}</span>
                </span>
            );
        } else if (this.props.command.type === "function") {
            return (
                <span>
                    <span className="fn">{this.props.command.triggerFn}</span>
                </span>
            )
        } else {
            return null;
        }
    }

    render() {
        return (
            <div className="cmdItem">
                <p className="cmdName">{this.props.command.name}</p>
                <span className="cmdMarker">
                    {this.renderMarker()}
                </span>
                <p className="cmdPath"> {path.basename(this.props.command.file)} </p>
                {this.renderSummary()}
                <div className="deleteBtn" onClick={() => this.props.delete(this.props.command.id)}>
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                </div>
            </div>
        );
    }
}