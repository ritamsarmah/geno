import React, { Component } from 'react';

import './CommandItem.css';

const path = require('path');

export default class CommandItem extends Component {
    render() {
        return (
            <div className="cmdItem">
                <p className="cmdName">{this.props.command.name}</p>
                <p className="cmdPath"> {path.basename(this.props.command.file)}</p>
                <span className="fn">{this.props.command.triggerFn}</span>
            </div>
        );
    }
}