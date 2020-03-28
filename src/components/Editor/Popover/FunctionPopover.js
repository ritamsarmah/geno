import React from 'react';
import Popover from './Popover';
import database from '../../../common/Database';
import { ContextType } from '../../../common/constants';

import './Popover.css'

export default class FunctionPopover extends Popover {

    POPOVER_MAIN = 0;
    POPOVER_OPTIONS = 1;

    constructor(props) {
        super(props);

        this.state.popoverState = this.POPOVER_MAIN;
        this.state.buttonValue = "Train Model";
    }

    bindFunctions() {
        super.bindFunctions();

        this.showMain = this.showMain.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.trainModel = this.trainModel.bind(this);
    }

    /* Switch to main form */
    showMain() {
        this.setState({ popoverState: this.POPOVER_MAIN });
    }

    /* Switch to advanced options */
    showOptions() {
        this.setState({
            renderAnalysis: false,
            popoverState: this.POPOVER_OPTIONS
        });
    }

    /* Updates command name in database */
    changeCommandName(name) {
        database.updateCommand(this.state.command.id, {
            name: name
        });
    }

    /* Deletes command from database */
    deleteCommand() {
        database.removeCommand(this.state.command.id);
        super.deleteCommand();
    }

    /* Adds query for command to database */
    addQuery(text) {
        this.setState({
            command: database.addQuery(this.state.command.id, text)
        });
    }

    /* Update query for command in database */
    updateQuery(queryId, oldText, newText, callback) {
        database.updateQuery(this.state.command.id, queryId, oldText, newText, (command, updatedQuery) => {
            // Don't want to trigger setState updates
            // eslint-disable-next-line
            this.state.command = command;
            callback(updatedQuery);
        });
    }

    /* Deletes query for command from database */
    deleteQuery(query) {
        this.setState({
            command: database.removeQuery(this.state.command.id, query.id)
        });
    }

    /* Change value for backup query */
    changeBackupQuery(event, paramName) {
        this.setState({
            command: database.updateBackupQuery(this.state.command.id, paramName, event.target.value)
        });
    }

    /* Change value for which parameter inferred from element under mouse */
    changeContextParameter(param) {
        this.setState({
            command: database.updateContextParameter(this.state.command.id, param)
        });
    }

    /* Change element attribute(s) to return as a parameter for multimodal input */
    toggleContextAttribute(attribute) {
        this.setState({
            command: database.toggleContextAttribute(this.state.command.id, attribute)
        });
    }

    /* Reset context information */
    clearContextInfo() {
        this.setState({
            command: database.clearContextInfo(this.state.command.id)
        });
    }

    /* Processes received context elements and displays to user */
    processContext(context) {
        this.setState({
            command: database.updateCommandContext(this.state.command.id, {
                selector: context.selector,
                type: ContextType.Element,
                attributes: [], // reset attributes if we are changing selector, since old attributes are meaningless
                allAttributes: context.attributes,
                attributeExamples: context.attributeExamples
            })
        });
    }

    /* Train model */
    trainModel(e) {
        var button = e.target
        button.value = "Training..."
        database.trainModel(this.state.command.id, (error) => {
            this.setState({ buttonValue: `Train Model (${error ? "Failed" : "Success"})` });
            if (error) {
                window.alert(error);
            }
        });
    }

    /* UI Rendering Functions */
    
    renderButtons() {
        return (
            <div>
                <input className="conditionalButton" style={{ margin: "10px 0" }} type="button" value={this.state.buttonValue} onClick={this.trainModel} disabled={this.isCommandValid()}></input>
                <br></br>
                <div id="bottomButtons">
                    <input type="button" value="Options" onClick={this.showOptions}></input>
                    <input type="button" style={{ marginLeft: "8px", color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                </div>
            </div>
        );
    }

    renderOptions() {
        return (
            <div>
                <div className="popover">
                    <form className="popoverForm">
                        <p className="popoverTitle">Parameters</p>
                        <p className="popoverSubtitle">Add follow up questions to ask when a parameter is not provided by user.</p>
                        {this.state.command.parameters.map(p => {
                            return (
                                <div key={p.name}>
                                    <p className="paramTitle">{p.name}</p>
                                    <input type="text" defaultValue={p.backupQuery} placeholder={`e.g. What is ${p.name}?`} onChange={(event) => this.changeBackupQuery(event, p.name)}></input>
                                </div>
                            )
                        })}
                        <input type="button" value="Done" onClick={this.showMain}></input>
                    </form>
                </div>
            </div>
        );
    }

    render() {
        switch (this.state.popoverState) {
            case this.POPOVER_MAIN:
                return super.render();
            case this.POPOVER_OPTIONS:
                return this.renderOptions();
            default:
                break;
        }
    }
}
