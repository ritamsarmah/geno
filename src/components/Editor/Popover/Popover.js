import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus, faMouse } from '@fortawesome/free-solid-svg-icons';
import { GenoEvent } from '../../../common/constants';

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
            renderAnalysis: false,
            selectedQuery: null,
            command: this.props.command,
            popoverState: this.POPOVER_MAIN,
            flipSide: false,
            isTrackingContext: false
        };

        this.dismiss = this.dismiss.bind(this);
        this.toggleQueries = this.toggleQueries.bind(this);
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
        this.changeReturnAttribute = this.changeReturnAttribute.bind(this);
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
        })
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

    /* Change value for selector to use for context */
    changeContextSelector(event) {
        // TODO
        var param = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateContextParameter(this.state.command.id, param)
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
    changeReturnAttribute(event) {
        // TODO
        var attr = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateContextReturnAttributes(this.state.command.id, attr.split(' '))
        });
    }

    /* Change type of return value for context */
    changeContextType(event) {
        // TODO
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
                emitter.removeListener(GenoEvent.ShareContext, this.processContext);
            }
        });
    }

    /* Processes received context elements and displays to user */
    processContext(elements) {
        console.log(elements);
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
            <select defaultValue={selection} onChange={this.changeContextParameter}>
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

                                {/* Sample Queries */}
                                <p className="popoverTitle">Sample Queries</p>
                                <div>
                                    <div>
                                        <input id="addQueryInput" type="text" placeholder="Add sample query"></input>
                                        <span className="iconButton" onClick={this.addQuery}>
                                            <FontAwesomeIcon icon={faPlus} />
                                        </span>
                                    </div>

                                    <div id="queriesView" style={{
                                        height: this.state.queriesExpanded ? "140px" : "70px",
                                        resize: this.state.queriesExpanded ? "vertical" : "none"
                                    }}>
                                        {this.state.command.queries.map(q => <div key={q.id} className="nlpQuery" onClick={() => this.showAnalysis(q)}>{q.text}</div>)}
                                    </div>

                                    <div id="queryToggle" onClick={this.toggleQueries}>
                                        <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                                    </div>
                                </div>

                                {/* Multimodal Context */}
                                <p className="popoverTitle">Multimodal Context</p>
                                <div>
                                    {this.renderContextDropdown()}
                                    <span className="iconButton" onClick={this.toggleTrackingContext}>
                                        <FontAwesomeIcon icon={faMouse} />
                                    </span>
                                    {/* <div>
                                        {this.state.command.queries.map(q => <div key={q.id} className="nlpQuery" onClick={() => this.showAnalysis(q)}>{q.text}</div>)}
                                    </div> */}
                                </div>
                                <div>
                                    
                                </div>

                                <input type="button" style={{ marginBottom: "8px" }} value="Train Model" onClick={this.trainModel}></input>
                                <br></br>
                                <div id="bottomButtons">
                                    <input type="button" value="Options" onClick={this.showOptions}></input>
                                    <input type="button" style={{ marginLeft: "8px", color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
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
