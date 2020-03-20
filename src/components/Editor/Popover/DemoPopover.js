import React from 'react';
import Popover from './Popover'

import './Popover.css'

import database from '../../../common/Database';
import { createCountMessage } from '../../../common/utils';

export default class DemoPopover extends Popover {

    constructor(props) {
        super(props);
        this.state.flipSide = this.props.flipSide;
        this.changeDelay = this.changeDelay.bind(this);
    }

    /* Change delay for demo command */
    changeDelay(event) {
        var delay = event.target.value;
        this.setState({
            command: database.updateDelay(this.state.command.id, delay)
        });
    }

    changeParameter(event, oldName) {
        // TODO: Fix the bug here that moves popover down for some reason
        if (event.target.value !== "") {
            this.setState({
                command: database.updateParameterName(this.state.command.id, oldName, event.target.value)
            });
        }
    }

    renderSummary() {
        return (
            <div>
                <p className="popoverTitle">Summary</p>
                <div className="popoverFn">{createCountMessage(this.state.command.elements.length, "action")}</div>
                <div className="popoverFn">{createCountMessage(this.state.command.parameters.length, "parameter")}</div>
            </div>
        );
    }

    render() {
        if (this.state.popoverState === this.POPOVER_OPTIONS) {
            return (
                <div>
                    <div className="popover">
                        <form className="popoverForm">
                            <p className="popoverTitle">Click Delay</p>
                            <p className="popoverSubtitle">Delay in seconds before clicking elements</p>
                            <input type="text" defaultValue={this.state.command.delay} onChange={(event) => this.changeDelay(event)}></input>
                        </form>
                        <input type="button" value="Done" onClick={this.showMain}></input>
                    </div>
                </div>
            );
        } else {
            return super.render();
        }
    }
}
