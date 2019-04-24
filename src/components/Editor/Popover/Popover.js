import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus, faMicrophone } from '@fortawesome/free-solid-svg-icons';

import './Popover.css'

import database from '../../../Database';

const electron = window.require('electron');
const BrowserWindow = electron.remote.BrowserWindow;

var optionsWindow;

export default class Popover extends Component {

    constructor(props) {
        super(props);
        this.state = {
            queriesExpanded: false,
            renderAnalysis: false,
            selectedQuery: null,
            command: this.props.command
        };
        this.dismiss = this.dismiss.bind(this);
        this.toggleQueries = this.toggleQueries.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);

        this.deleteCommand = this.deleteCommand.bind(this);
        this.changeCommandName = this.changeCommandName.bind(this);
        this.addQuery = this.addQuery.bind(this);
        this.deleteQuery = this.deleteQuery.bind(this);
    }

    dismiss() {
        this.props.unmountMe();
    }

    toggleQueries() {
        this.setState({ queriesExpanded: !this.state.queriesExpanded });
    }

    showOptions() {
        let optionsWindow = new BrowserWindow({ width: 300, height: 500, title: "Options" });
        optionsWindow.on('closed', () => { optionsWindow = null });
    }

    showAnalysis(query) {
        this.setState({
            renderAnalysis: true,
            selectedQuery: query
        });
    }

    handleAnalysisUnmount() {
        this.setState({ renderAnalysis: false });
        // TODO: save changes to query and query settings/re-read from database
    }

    /* Command/Query Database Changes */

    changeCommandName() {
        var commandNameInput = document.getElementById("commandNameInput");
        database.updateCommand(this.state.command.id, {
            name: commandNameInput.value
        });
    }

    deleteCommand() {
        database.removeCommand(this.state.command.id);
        this.dismiss();
    }

    addQuery() {
        var queryInput = document.getElementById('addQueryInput');
        if (queryInput.value != "") {
            this.setState({
                command: database.addQuery(this.state.command.id, queryInput.value)
            }, () => queryInput.value = "");
            // TODO propagate update to parent marker??
        }
    }

    deleteQuery(query) {
        this.setState({
            command: database.removeQuery(this.state.command.id, query.id)
        });
    }

    render() {
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

                        <p className="popoverTitleButtons">Sample Queries</p>

                        <div style={{ marginTop: "30px" }}>
                            <input id="addQueryInput" type="text" placeholder="Add sample query"></input>
                            <span className="iconButton" onClick={this.addQuery}>
                                <FontAwesomeIcon icon={faPlus} />
                            </span>
                            <span className="iconButton" onClick={this.recordQuery}>
                                <FontAwesomeIcon icon={faMicrophone} />
                            </span>

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
                        <input type="button" style={{ color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                        <input type="button" value="Options" onClick={this.showOptions}></input>
                    </form>
                </div>
                {this.state.renderAnalysis ? <AnalysisView query={this.state.selectedQuery} deleteQuery={this.deleteQuery} unmountMe={this.handleAnalysisUnmount} /> : null}
            </div>
        );
    }
}
