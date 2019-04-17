import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import AnalysisView from '../AnalysisView/AnalysisView';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './Popover.css'
import { faChevronDown, faChevronUp, faPlus, faMicrophone } from '@fortawesome/free-solid-svg-icons';

// const { BrowserWindow } = window.require('electron');
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
        };
        this.toggleQueries = this.toggleQueries.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);
    }

    toggleQueries() {
        this.setState({ queriesExpanded: !this.state.queriesExpanded });
    }

    save() {
        // TODO
        console.log("Save");
    }

    showOptions() {
        let optionsWindow = new BrowserWindow({ width: 300, height: 500 });
        optionsWindow.on('closed', () => { optionsWindow = null });
    }

    showAnalysis(query) {
        console.log("NLP::", query);
        this.setState({
            renderAnalysis: true,
            selectedQuery: query
        });
    }

    handleAnalysisUnmount() {
        this.setState({ renderAnalysis: false });
    }

    deleteQuery(query) {
        // TODO
    }

    render() {
        return (
            <div>
                <div className="popover">
                    <form className="popoverForm">
                        <p className="popoverTitle">Command Name</p>
                        <input type="text"></input>

                        <p className="popoverTitle">Triggered Function</p>
                        <div className="popoverFn">{this.props.command.triggerFn}</div>
                        <br></br>
                        <br></br>

                        <p className="popoverTitleButtons">Sample Queries</p>

                        <div style={{ marginTop: "30px" }}>
                            <input id="addQueryInput" type="text" placeholder="Add sample query"></input>
                            <span className="iconButton" onClick={this.addQuery}>
                                <FontAwesomeIcon icon={faPlus} />
                            </span>
                            <span className="iconButton" onClick={this.addQuery}>
                                <FontAwesomeIcon icon={faMicrophone} />
                            </span>

                            <div id="queriesView" style={{
                                height: this.state.queriesExpanded ? "140px" : "70px",
                                resize: this.state.queriesExpanded ? "vertical" : "none"
                            }}>
                                {this.props.command.queries.map(q => <div className="nlpQuery" onClick={() => this.showAnalysis(q)}>{q.query}</div>)}
                            </div>

                            <div id="queryToggle" onClick={this.toggleQueries}>
                                <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                            </div>
                        </div>

                        <br></br>
                        <input type="button" value="Save" onClick={this.save}></input>
                        <input type="button" value="Options" onClick={this.showOptions}></input>
                    </form>
                </div>
                {this.state.renderAnalysis ? <AnalysisView query={this.state.selectedQuery} deleteQuery={this.deleteQuery} unmountMe={this.handleAnalysisUnmount} /> : null}
            </div>
        );
    }
}
