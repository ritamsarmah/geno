import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus, faQuestionCircle, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { Colors, GenoEvent } from '../../../common/constants';

import './Popover.css'

import database from '../../../common/Database';
import emitter from '../../../common/Emitter';

export default class Popover extends Component {

    POPOVER_MAIN = 0;
    POPOVER_OPTIONS = 1;
    POPOVER_CONTEXT = 2;

    constructor(props) {
        super(props);
        this.state = {
            queriesExpanded: false,
            contextExpanded: false,
            renderAnalysis: false,
            selectedQuery: null,
            command: this.props.command,
            popoverState: this.POPOVER_MAIN,
            flipSide: false,
            isTrackingContext: false
        };

        this.dismiss = this.dismiss.bind(this);
        this.toggleQueries = this.toggleQueries.bind(this);
        this.toggleContext = this.toggleContext.bind(this);
        this.showMain = this.showMain.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.showContext = this.showContext.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);

        this.deleteCommand = this.deleteCommand.bind(this);
        this.changeCommandName = this.changeCommandName.bind(this);
        this.addQuery = this.addQuery.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.deleteQuery = this.deleteQuery.bind(this);
        this.changeBackupQuery = this.changeBackupQuery.bind(this);
        this.changeContextType = this.changeContextType.bind(this);
        this.changeContextParameter = this.changeContextParameter.bind(this);
        this.changeAttribute = this.changeAttribute.bind(this);
        this.toggleTrackingContext = this.toggleTrackingContext.bind(this);
        this.processContext = this.processContext.bind(this);
        this.trainModel = this.trainModel.bind(this);
    }

    /* Dismisses this component */
    dismiss() {
        this.props.unmountMe();
    }

    /* Toggle resizing of sample queries list */
    toggleQueries() {
        this.setState({ queriesExpanded: !this.state.queriesExpanded });
    }

    /* Toggle resizing of context list */
    toggleContext() {
        this.setState({ contextExpanded: !this.state.contextExpanded });
    }

    /* Switch to main form */
    showMain() {
        this.setState({
            popoverState: this.POPOVER_MAIN
        });
    }

    /* Switch to advanced options */
    showOptions() {
        this.setState({
            renderAnalysis: false,
            popoverState: this.POPOVER_OPTIONS
        })
    }

    /* Switch to context options */
    showContext() {
        this.setState({
            renderAnalysis: false,
            popoverState: this.POPOVER_CONTEXT
        })
    }

    /* Shows AnalysisView for editing a selected query */
    showAnalysis(query) {
        this.setState({
            renderAnalysis: true,
            selectedQuery: query
        });
    }

    /* Handles unmount of AnalysisView */
    handleAnalysisUnmount() {
        this.setState({
            renderAnalysis: false,
        });
    }

    /* Updates command name in database */
    changeCommandName(event) {
        database.updateCommand(this.state.command.id, {
            name: event.target.value.replace(/ /g, "_")
        });
    }

    /* Deletes command from database */
    deleteCommand() {
        database.removeCommand(this.state.command.id);
        this.dismiss();
    }

    /* Adds query for command to database */
    addQuery() {
        var queryInput = document.getElementById('addQueryInput');
        if (queryInput.value !== "") {
            this.setState({
                command: database.addQuery(this.state.command.id, queryInput.value)
            }, () => queryInput.value = "");
        }
    }

    /* Update query for command in database */
    updateQuery(oldText, query, callback) {
        database.updateQuery(this.state.command.id, oldText, query, (command, updatedQuery) => {
            this.state.command = command; // Don't want to trigger setState updates
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
    changeContextParameter(event) {
        var param = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateContextParameter(this.state.command.id, param)
        });
    }

    /* Change element attribute(s) to return as a parameter for multimodal input */
    changeAttribute(event) {
        // TODO: Use data from the checkbox dropdown
        var attr = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateContextAttributes(this.state.command.id, attr.split(' '))
        });

        // call change context type in callback for set state if type != text, checking attributes list?
    }

    /* Change type of return value for context */
    changeContextType(event) {
        // TODO: On checkbox change if list of checked attributes is not empty, attribute, else element
        // TODO: Also call on text selection
        var type = event.target.value;
        this.setState({
            command: database.updateContextType(this.state.command.id, type)
        });
    }

    /* Toggle tracking context in Preview */
    toggleTrackingContext() {
        this.setState({ isTrackingContext: !this.state.isTrackingContext }, () => {
            if (this.state.isTrackingContext) {
                emitter.on(GenoEvent.ShareContext, this.processContext);
                emitter.emit(GenoEvent.TrackContext);
            } else {
                emitter.emit(GenoEvent.StopTrackContext);
            }
        });
    }

    /* Processes received context elements and displays to user */
    processContext(selector, attributes) {
        console.log(selector);
        console.log(attributes);
        this.setState({
            command: database.updateCommandContext(this.state.command.id, {
                selector: selector,
                allAttributes: attributes
            })
        });
        emitter.removeListener(GenoEvent.ShareContext, this.processContext);
    }

    trainModel(e) {
        var button = e.target
        button.value = "Training..."
        database.trainModel(this.state.command.id, (res, status) => {
            if (status === 200) {
                console.log(res);
                button.value = "Train Model (Success)"
            } else {
                button.value = "Train Model (Failed)"
            }
        });
    }

    /* UI Rendering Functions */

    renderSummary() {
        return (
            <div>
                <p className="popoverTitle">Triggered Function</p>
                <div className="popoverFn">{this.state.command.triggerFn}</div>
            </div>
        );
    }

    renderContextDropdown() {
        var names = this.state.command.parameters.map(p => p.name);
        names.push("-");

        var selection = this.state.command.contextInfo.parameter != null ? this.state.command.contextInfo.parameter : "-";

        return (
            <select defaultValue={selection} onChange={this.changeContextParameter} style={{ width: "86%" }}>
                {names.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        );
    }

    render() {
        switch (this.state.popoverState) {
            case this.POPOVER_MAIN:
                return (
                    <div>
                        <div className="popover">
                            <form className="popoverForm">
                                {/* Command Name */}
                                <p className="popoverTitle">Command Name</p>
                                <input id="commandNameInput" type="text" defaultValue={this.state.command.name} onChange={this.changeCommandName}></input>

                                {/* Summary */}
                                {this.renderSummary()}
                                <br></br>
                                <br></br>

                                {/* Example Queries */}
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <p className="popoverTitle">Example Queries</p>
                                    <span className="tooltip">
                                        <FontAwesomeIcon icon={faQuestionCircle}></FontAwesomeIcon>
                                        <span className="tooltiptext">
                                            Create examples of how the user may trigger this voice command. You don't need to worry about having the user say the exact query or creating an exhaustive list, but the more examples you give, the more accurate the voice recognition will be.
                                            <br></br>
                                            <br></br>
                                            You can specify if parts of the query correspond to command parameters by clicking on the query in the list, and in the new view that appears, selecting a parameter in the dropdown under the word(s). To edit query text, click on the pencil icon.
                                            <br></br>
                                            <br></br>
                                            Once you've finished adding your queries and configuring the parameters, click "Train Model" at the bottom to save the command (this may take a few seconds).
                                        </span>
                                    </span>
                                </div>
                                <div>
                                    <div>
                                        <input id="addQueryInput" type="text" placeholder="Add example query"></input>
                                        <span className="iconButton" onClick={this.addQuery}>
                                            <FontAwesomeIcon icon={faPlus} />
                                        </span>
                                    </div>

                                    <div className="listView" style={{
                                        minHeight: "52px",
                                        height: this.state.queriesExpanded ? "140px" : "52px",
                                        resize: this.state.queriesExpanded ? "vertical" : "none"
                                }}>
                                        {this.state.command.queries.map(q => <div key={q.id} className="listItem" onClick={() => this.showAnalysis(q)}>{q.text}</div>)}
                                    </div>

                                    <div className="listToggle" onClick={this.toggleQueries}>
                                        <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                                    </div>
                                </div>

                                {/* Multimodal Context */}
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <p className="popoverTitle">Multimodal Input</p>
                                    <span className="tooltip">
                                        <FontAwesomeIcon icon={faQuestionCircle}></FontAwesomeIcon>
                                        <span className="tooltiptext">
                                            Multimodal input allows users to provide a command parameter by hovering over a single element, dragging over multiple elements, or highlighting text. If you select a parameter in the dropdown, multimodal context will be passed in as the value for that parameter.
                                            <br></br>
                                            <br></br>
                                            You can optionally specify the element type that should be recognized as context, by clicking the crosshairs and hovering over an element in the webpage to select it. Click the button again to stop selection. The element's ID or tag/class will be used to disambiguate if possible.
                                            <br></br>
                                            <br></br>
                                            You may also specify the element attribute(s) to use for the parameter's value. After selecting the element type, click the element in the popover and select the desired attribute(s).
                                        </span>
                                    </span>
                                </div>
                                <p className="popoverSubtitle">Infers parameter value from mouse context</p>
                                <div>
                                    {this.renderContextDropdown()}
                                    <span className="iconButton" onClick={this.toggleTrackingContext}>
                                        <FontAwesomeIcon icon={faCrosshairs} style={{ color: this.state.isTrackingContext ? Colors.Theme : "black" }} />
                                    </span>

                                    <br></br>
                                    {/* TODO add onclick for the element to show attributes list */}
                                    {/* Add checkbox for textselection */}
                                    {/* Add button to clear context if exists */}
                                    {/* <div className="contextItem"></div> */}
                                    {this.state.command.contextInfo.selector}

                                    <input type="button" style={{ marginBottom: "8px" }} value="Train Model" onClick={this.trainModel}></input>
                                    <br></br>
                                    <div id="bottomButtons">
                                        <input type="button" value="Options" onClick={this.showOptions}></input>
                                        <input type="button" style={{ marginLeft: "8px", color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                                    </div>
                                </div>
                            </form>
                        </div>
                        {this.state.renderAnalysis ? <AnalysisView command={this.state.command} query={this.state.selectedQuery} updateQuery={this.updateQuery} deleteQuery={this.deleteQuery} flipSide={this.state.flipSide} unmountMe={this.handleAnalysisUnmount} /> : null}
                    </div>
                );
            case this.POPOVER_OPTIONS:
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
                                            <input type="text" defaultValue={p.backupQuery} placeholder="Follow up question" onChange={(event) => this.changeBackupQuery(event, p.name)}></input>
                                        </div>
                                    )
                                })}
                                <input type="button" value="Done" onClick={this.showMain}></input>
                            </form>
                        </div>
                    </div>
                );
            default:
                break;
        }
    }
}
