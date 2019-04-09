import React, { Component } from 'react';
import CommandItem from './CommandItem/CommandItem';

import './CommandList.css';

export default class CommandList extends Component {
    render() {
        const commands = [{
            name: "Schedule an event",
            triggerFns: ["addEvent"]

        }, {
            name: "Delete event with title",
            triggerFns: ["removeEventByTitle", "showConfirmPopup"]

        }];
        const listItems = commands.map((command) =>
            <CommandItem command={command} />
        );
        return (
            <div style={{width: "auto"}}>
                {listItems}
            </div>
        );
    }
}