import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faSyncAlt, faPen } from '@fortawesome/free-solid-svg-icons';

import database from '../../../common/Database';
import utils from '../../../common/utils';

import "./AnalysisView.css"

export default class AnalysisView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            query: this.props.query,
            editMode: false // Editing text vs. displaying NLP info
        }
        this.dismiss = this.dismiss.bind(this);
        this.delete = this.delete.bind(this);
        this.updateNLPInfo = this.updateNLPInfo.bind(this);
        this.colorEntities = this.colorEntities.bind(this);
        this.toggleEdit = this.toggleEdit.bind(this);
        this.spinRefresh = this.spinRefresh.bind(this);

        if (this.props.flipSide) {
            this.sideName = "analysis-left";
        } else {
            this.sideName = "analysis-right";
        }
    }

    componentDidMount() {
        this.colorEntities();
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            query: newProps.query,
            editMode: false
        }, () => {
            this.colorEntities();
        });
    }

    /* Dismisses this component, passing back any updates to query */
    dismiss() {
        this.props.unmountMe();
    }

    /* Deletes query and dismisses this component */
    delete() {
        this.props.deleteQuery(this.state.query);
        this.dismiss();
    }

    /* Create text segment for NLP information */
    createEntitySegment(entity, finalSegment) {
        var text = this.state.query.text.substring(entity.start, entity.end);
        var color = entity.label != null ? utils.stringToColor(entity.label) : "lightgray";
        var marginRight = finalSegment ? "0px" : "10px";
        return (
            <span id={entity.start} className="textSegment" style={{ borderBottomColor: color, marginRight: marginRight }} onFocus={this.removeHighlights}>
                {text}
            </span>
        );
    }

    /* Update entity label */
    updateEntity(query, entity, event) {
        var label = event.target.value === "-" ? null : event.target.value
        database.updateEntity(this.props.command.id, query.id, entity, label);
        this.colorEntities();
    }

    /* Create dropdown for text segment */
    createDropdown(query, entity) {
        var color = utils.stringToColor(entity.label);

        var names = this.props.command.parameters.map(p => p.name);
        names.unshift("-");

        var selection = entity.label != null ? entity.label : "-";

        return (
            <select className="entitySelect" id={entity.start} data-curr={selection} defaultValue={selection} style={{ color: color }} onChange={(event) => this.updateEntity(query, entity, event)}>
                {names.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        )
    }

    /* Toggles edit mode */
    toggleEdit() {
        // Update NLP info and complete before changing icon
        if (this.state.editMode) {
            var content = document.getElementById("editableQuery");
            this.updateNLPInfo(content.innerHTML);
        } else {
            this.setState({ editMode: !this.state.editMode });
        }
    }

    /* Updates entity coloring based on new analysis */
    updateNLPInfo(newText) {
        this.spinRefresh(true);
        var oldText = this.state.query.text;
        var thisAnalysis = this;

        var newQuery = this.state.query;
        newQuery.text = newText;
        this.props.updateQuery(oldText, newQuery, (updatedQuery) => {
            thisAnalysis.state.query = updatedQuery;
            thisAnalysis.setState({ editMode: false });
            thisAnalysis.colorEntities();
            thisAnalysis.spinRefresh(false);
        });
    }

    /* Sets colored underlines under query representing NLP entity */
    colorEntities() {
        var content = document.getElementById("nlpQuery");
        if (!content) {
            return;
        }
        content.innerHTML = "";

        var numEntities = Object.keys(this.state.query.entities).length 

        if (numEntities === 0) {
            content.innerHTML = this.state.query.text;
        } else {
            Object.keys(this.state.query.entities).forEach((index, i) => {
                var entity = this.state.query.entities[index]; 
                const dummy = document.createElement("span"); // Create dummy div to render
                content.appendChild(dummy);
                var spaceNeeded = (i === numEntities - 1); // Add space between text segments

                ReactDOM.render(this.createEntitySegment(entity, spaceNeeded), dummy, () => {
                    var span = document.getElementById(entity.start);
                    const dropdownDummy = document.createElement("span"); // Create dummy div to render
                    span.appendChild(dropdownDummy);
                        ReactDOM.render(this.createDropdown(this.state.query, entity), dropdownDummy);
                });
            });
        }
    }

    /* Toggle refresh spinning */
    spinRefresh(spin) {
        var refresh = document.getElementById("refresh");
        if (spin) {
            refresh.classList.add("spin");
            refresh.disabled = true;
        } else {
            refresh.classList.remove("spin");
            refresh.disabled = false;
        }
    }

    render() {
        return (
            <div id="analysisView" className={this.sideName}>
                <div id="close" onClick={this.dismiss}>
                    <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                </div>
                <div id="refresh" onClick={this.toggleEdit}>
                    <FontAwesomeIcon icon={this.state.editMode ? faSyncAlt : faPen}></FontAwesomeIcon>
                </div>
                <div id="delete" onClick={this.delete}>
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                </div>
                {this.state.editMode ?
                    <span id="editableQuery" contentEditable={true} suppressContentEditableWarning={true}>{this.state.query.text}</span> :
                    <span id="nlpQuery"></span>
                }
            </div>
        )
    }
}
