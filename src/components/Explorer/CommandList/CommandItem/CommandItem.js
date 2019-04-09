import React, { Component } from 'react';

import './CommandItem.css';

export default class CommandItem extends Component {
    render() {
        const functions = this.props.command.triggerFns.map((fn) =>
            <span className="fn">{fn}</span>
        );
        return (
            <div className="commandItem">
                <p>{this.props.command.name}</p>
                {functions}
            </div>
        );
    }
}