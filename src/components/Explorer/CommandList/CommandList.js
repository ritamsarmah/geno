import React, { Component } from 'react';
import CommandItem from './CommandItem/CommandItem';

import database from '../../../common/Database';

import './CommandList.css';

export default class CommandList extends Component {
    constructor(props) {
        super(props);
        this.delete = this.delete.bind(this);
    }

    delete(commandId) {
        database.removeCommand(commandId);
        this.forceUpdate();
    }

    render() {
        const commands = database.getCommands(); 
        const listItems = commands.map((command) =>
            <CommandItem key={command.id} command={command} delete={this.delete}/>
        );
        return (
            <div className="commandList">
                {listItems}
            </div>
        );
    }
}