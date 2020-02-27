import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons';

import './Popover.css'

import database from '../../../common/Database';

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
            flipSide: false
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
        this.changeMouseParameter = this.changeMouseParameter.bind(this);
        this.changeMouseAttribute = this.changeMouseAttribute.bind(this);
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

    /* Change value for which parameter inferred from element under mouse */
    changeMouseParameter(event) {
        var param = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateMouseParameter(this.state.command.id, param)
        });
    }

    /* Change attribute to use when passing data for parameter from element under mouse */
    changeMouseAttribute(event) {
        var attr = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateMouseAttribute(this.state.command.id, attr)
        });
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

    renderMultimodal() {
        var params = this.state.command.parameters.map(p => p.name);
        params.push('-');

        return (
            <div className="popover">
                <form className="popoverForm">
                    <p className="popoverTitle">Multimodal Context</p>
                    <p className="popoverSubtitle">
                        Allow
                                <select className="popoverDropdown"
                            defaultValue={(!this.state.command.mouseParameter) ? "-" : this.state.command.mouseParameter}
                            onChange={(event) => this.changeMouseParameter(event)}>
                            {params.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        to be retrieved using mouse context.
                            </p>
                    <input type="radio" id="contextElement" className="popoverLabel" name="contextType" value="element"></input>
                    <label for="contextElement">Element(s)</label><br></br>
                    <input type="radio" id="contextAttribute" className="popoverLabel" name="contextType" value="attribute"></input>
                    <label for="contextAttribute">
                        Element attribute
                                <input id="mouseDataAttribute" type="text" placeholder="(leave empty to return element)" defaultValue={this.state.command.mouseAttribute} onChange={this.changeMouseAttribute}></input>
                    </label>
                    <br></br>
                    <input type="radio" id="contextText" className="popoverLabel" name="contextType" value="text"></input>
                    <label for="contextText">Highlighted Text Selection</label><br></br>
                    <br></br>
                    <input type="button" value="Done" onClick={this.showMain}></input>
                </form>
            </div>
        );
    }

    render() {
        switch (this.state.popoverState) {
            case this.POPOVER_MAIN:
                return (
                    <div>
                        <div className="popover">
                            <form className="popoverForm">
                                <p className="popoverTitle">Command Name</p>
                                <input id="commandNameInput" type="text" defaultValue={this.state.command.name} onChange={this.changeCommandName}></input>

                                {this.renderSummary()}
                                <br></br>
                                <br></br>

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
                                <input type="button" style={{ marginBottom: "8px" }} value="Train Model" onClick={this.trainModel}></input>
                                <br></br>
                                <div id="bottomButtons">
                                    <input type="button" value="Options" onClick={this.showOptions}></input>
                                    <input type="button" style={{ marginLeft: "8px" }} value="Context" onClick={this.showContext}></input>
                                    <input type="button" style={{ marginLeft: "8px", color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                                </div>
                            </form>
                        </div>
                        {this.state.renderAnalysis ? <AnalysisView command={this.state.command} query={this.state.selectedQuery} updateQuery={this.updateQuery} deleteQuery={this.deleteQuery} unmountMe={this.handleAnalysisUnmount} flipSide={this.state.flipSide} /> : null}
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
            case this.POPOVER_CONTEXT:
                return this.renderMultimodal();
            default:
                break;
        }
    }
}
