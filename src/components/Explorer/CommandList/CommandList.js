import React, { Component } from 'react';
import CommandItem from './CommandItem/CommandItem';

import './CommandList.css';

export default class CommandList extends Component {
    render() {
        const commands = [{
            name: "Schedule an event",
            triggerFn: "addEvent",
            path: "src/event.js"

        }, {
            name: "Delete event with title",
            triggerFn: "removeEventByTitle",
            path: "src/event.js"

        }, {
            name: "A command with a really long name that should wrap around so it can be read",
            triggerFn: "someFunction",
            path: "src/some_filename.js"

        },
        {
            name: "Schedule an event",
            triggerFn: "addEvent",
            path: "src/event.js"

        }, {
            name: "Delete event with title",
            triggerFn: "removeEventByTitle",
            path: "src/event.js"

        }, {
            name: "A command with a really long name that should wrap around so it can be read",
            triggerFn: "someFunction",
            path: "src/some_filename.js"

        }, {
            name: "Schedule an event",
            triggerFn: "addEvent",
            path: "src/event.js"

        }, {
            name: "Delete event with title",
            triggerFn: "removeEventByTitle",
            path: "src/event.js"

        }, {
            name: "A command with a really long name that should wrap around so it can be read",
            triggerFn: "someFunction",
            path: "src/some_filename.js"

        }];
        const listItems = commands.map((command) =>
            <CommandItem command={command} />
        );
        return (
            <div style={{ width: "auto", height: "95vh" }}>
                {listItems}
            </div>
        );
    }
}