import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons';

import './Popover.css'

import database from '../../../common/Database';

export default class Popover extends Component {

    constructor(props) {
        super(props);
        this.state = {
            queriesExpanded: false,
            renderAnalysis: false,
            selectedQuery: null,
            command: this.props.command,
            showingOptions: false
        };
        this.dismiss = this.dismiss.bind(this);
        this.toggleQueries = this.toggleQueries.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.hideOptions = this.hideOptions.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);

        this.deleteCommand = this.deleteCommand.bind(this);
        this.changeCommandName = this.changeCommandName.bind(this);
        this.addQuery = this.addQuery.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.deleteQuery = this.deleteQuery.bind(this);
        this.changeBackupQuery = this.changeBackupQuery.bind(this);
    }

    /* Dismisses this component */
    dismiss() {
        this.props.unmountMe();
    }

    /* Toggle resizing of sample queries list */
    toggleQueries() {
        this.setState({ queriesExpanded: !this.state.queriesExpanded });
    }

    /* Switch to advanced options */
    showOptions() {
        this.setState({
            renderAnalysis: false,
            showingOptions: true
        })
    }

    /* Switch to first form */
    hideOptions() {
        this.setState({
            showingOptions: false
        });
    }

    /* Shows AnalysisView for editing a selected query */
    showAnalysis(query) {
        this.setState({
            renderAnalysis: true,
            selectedQuery: query
        });
    }

    /* Handles unmount of AnalysisView */
    handleAnalysisUnmount(updatedQuery) {
        this.setState({
            renderAnalysis: false,
            command: database.updateQuery(this.state.command.id, updatedQuery)
        });
    }

    /* Updates command name in database */
    changeCommandName(event) {
        database.updateCommand(this.state.command.id, {
            name: event.target.value
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
            // TODO propagate update to parent marker??
        }
    }

    /* Update query for command in database */
    updateQuery(query) {
        // Don't want to trigger setState updates
        this.state.command = database.updateQuery(this.state.command.id, query)
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

    render() {
        if (this.state.showingOptions) {
            return (
                <div>
                    <div className="popover">
                        <form className="popoverForm">
                            <p className="popoverTitle">Function Parameters</p>
                            <p className="popoverSubtitle">Add follow up questions to ask when a parameter is not provided by user.</p>
                            {this.state.command.parameters.map(p => {
                                return (
                                    <div key ={p.name}>
                                        <p className="paramTitle">{p.name}</p>
                                        <input type="text" defaultValue={p.backupQuery} onChange={(event) => this.changeBackupQuery(event, p.name)}></input>
                                    </div>
                                )
                            })}


                            <br></br>
                            <input type="button" value="Done" onClick={this.hideOptions}></input>
                        </form>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    <div className="popover">
                        <form className="popoverForm">
                            <p className="popoverTitle">Command Name</p>
                            <input id="commandNameInput" type="text" defaultValue={this.state.command.name} onChange={this.changeCommandName}></input>

                            <p className="popoverTitle">Triggered Function</p>
                            <div className="popoverFn">{this.state.command.triggerFn}</div>
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
                                    {this.state.command.queries.map(q => <div key={q.id} className="nlpQuery" onClick={() => this.showAnalysis(q)}>{q.query}</div>)}
                                </div>

                                <div id="queryToggle" onClick={this.toggleQueries}>
                                    <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                                </div>
                            </div>

                            <br></br>
                            <div id="bottomButtons">
                                <input type="button" style={{ color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                                <input type="button" style={{ marginLeft: "8px" }} value="Options" onClick={this.showOptions}></input>
                            </div>
                        </form>
                    </div>
                    {this.state.renderAnalysis ? <AnalysisView commandId={this.state.command.id} parameters={this.state.command.parameters} query={this.state.selectedQuery} updateQuery={this.updateQuery} deleteQuery={this.deleteQuery} unmountMe={this.handleAnalysisUnmount} /> : null}
                </div>
            );
        }
    }
}
