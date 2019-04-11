import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import AnalysisView from '../AnalysisView/AnalysisView';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './Popover.css'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

export default class Popover extends Component {

    constructor(props) {
        super(props);
        this.state = {
            queriesExpanded: false,
            editMode: false,
            renderAnalysis: false,
            selectedQuery: null,
        };
        this.toggleQueries = this.toggleQueries.bind(this);
        this.toggleEdit = this.toggleEdit.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);
    }

    toggleQueries() {
        this.setState({ queriesExpanded: !this.state.queriesExpanded });
    }

    toggleEdit() {
        this.setState({ editMode: !this.state.editMode });
    }

    save() {
        // TODO
        console.log("Save");
    }

    showOptions() {
        // TODO
        console.log("Options");
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

    render() {
        var queries;
        var height = this.state.queriesExpanded ? "140px" : "70px";
        var resize = this.state.queriesExpanded ? "vertical" : "none";

        if (this.state.editMode) {
            queries = (
                <textarea id="queriesEdit" style={{
                    height: height,
                    resize: resize
                }} defaultValue={this.props.command.queries.map(q => q.query).join('\n')}></textarea>
            );
        } else {
            queries = (
                <div id="queriesView" style={{
                    height: height,
                    resize: resize
                }}>
                    {this.props.command.queries.map(q => <div className="nlpQuery" onClick={() => this.showAnalysis(q)}>{q.query}</div>)}
                </div>
            );
        }

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
                        <button className="smallButton" type="button">Record</button>
                        <button className="smallButton" onClick={this.toggleEdit} type="button">{this.state.editMode ? "View" : "Edit"}</button>

                        <div style={{ marginTop: "30px" }}>
                            {queries}
                            <div id="queryToggle" onClick={this.toggleQueries}>
                                <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                            </div>
                        </div>

                        <br></br>
                        <input type="button" value="Save" onClick={this.save} type="button"></input>
                        <input type="button" value="Options" onClick={this.showOptions} type="button"></input>
                    </form>
                </div>
                {this.state.renderAnalysis ? <AnalysisView query={this.state.selectedQuery} unmountMe={this.handleAnalysisUnmount} /> : null}
            </div>
        );
    }
}
