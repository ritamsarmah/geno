import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons';

import './Popover.css'

import database from '../../../common/Database';

export default class DemoPopover extends Component {

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
        this.changeDelay = this.changeDelay.bind(this);
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
            // TODO propagate update to parent marker??
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

    /* Change delay for demo command */
    changeDelay(event) {
        var delay = event.target.value;
        this.setState({
            command: database.updateDelay(this.state.command.id, delay)
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

    getElementCount() {
        var message = this.state.command.elements.length
        if (this.state.command.elements.length === 1) {
            message += " click";
        } else {
            message += " clicks";
        }
        return message;
    }

    render() {
        if (this.state.showingOptions) {
            return (
                <div>
                    <div className="popover">
                        <form className="popoverForm">
                            <p className="popoverTitle">Click Delay</p>
                            <p className="popoverSubtitle">Delay in seconds before clicking elements</p>
                            <input type="text" defaultValue={this.state.command.delay} onChange={(event) => this.changeDelay(event)}></input>
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

                            <p className="popoverTitle">Number of Clicks</p>
                            <div className="popoverFn">{this.getElementCount()}</div>
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
                                <input type="button" style={{ marginLeft: "8px", color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                            </div>
                        </form>
                    </div>
                    {this.state.renderAnalysis ? <AnalysisView command={this.state.command} query={this.state.selectedQuery} updateQuery={this.updateQuery} deleteQuery={this.deleteQuery} unmountMe={this.handleAnalysisUnmount} /> : null}
                </div>
            );
        }
    }
}