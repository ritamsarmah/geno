import React, { Component } from 'react';

import './CommandItem.css';

export default class CommandItem extends Component {
    render() {
        return (
            <div className="cmdItem">
                <p className="cmdName">{this.props.command.name}</p>
                <p className="cmdPath"> {this.props.command.path}</p>
                <span className="fn">{this.props.command.triggerFn}</span>
            </div>
        );
    }
}