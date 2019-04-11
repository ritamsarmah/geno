import React, { Component } from 'react';
import CommandItem from './CommandItem/CommandItem';

import './CommandList.css';

export default class CommandList extends Component {
    render() {
        const commands = [{
            id: "3424ac2a4c234c",
            name: "Schedule an event",
            triggerFn: "addEvent",
            path: "src/event.js"

        }, {
            id: "3aw34af4123123123",
            name: "Delete event with title",
            triggerFn: "removeEventByTitle",
            path: "src/event.js"

        }, {
            id: "q34a3w413",
            name: "A command with a really long name that should wrap around so it can be read",
            triggerFn: "someFunction",
            path: "src/some_filename.js"

        }];
        const listItems = commands.map((command) =>
            <CommandItem key={command.id} command={command} />
        );
        return (
            <div className="commandList">
                {listItems}
            </div>
        );
    }
}