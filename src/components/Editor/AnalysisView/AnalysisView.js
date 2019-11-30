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
        var text = this.state.query.query.substring(entity.start, entity.end);
        var color = entity.entity != null ? utils.stringToColor(entity.entity) : "lightgray";
        var marginRight = finalSegment ? "0px" : "10px";
        return (
            <span id={entity.entity} className="textSegment" style={{ borderBottomColor: color, marginRight: marginRight }} onFocus={this.removeHighlights}>
                {text}
            </span>
        )
    }

    /* Swap entity selection in dropdown */
    swapEntityNames(query, event) {
        var firstSelect = event.target;

        var first = firstSelect.dataset.curr;
        var second = firstSelect.value;

        var secondSelect = document.getElementById(`geno-select-${second}`);
        secondSelect.value = first;

        secondSelect.dataset.curr = first;
        firstSelect.dataset.curr = second;

        secondSelect.id = `geno-select-${first}`;
        firstSelect.id = `geno-select-${second}`

        this.state.query = database.swapEntityNames(this.props.command.id, query.id, first, second);
    }

    /* Create dropdown for text segment */
    createDropdown(query, entity) {
        var names = this.props.command.parameters.map(p => p.name);
        var color = utils.stringToColor(entity.entity);

        return (
            <select className="entitySelect" id={`geno-select-${entity.entity}`} data-curr={entity.entity} defaultValue={entity.entity} style={{ color: color }} onChange={(event) => this.swapEntityNames(query, event)}>
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
        var oldText = this.state.query.query;
        var thisAnalysis = this;

        var newQuery = this.state.query;
        newQuery.query = newText;
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
        content.innerHTML = "";

        if (this.state.query.entities.length === 0) {
            content.innerHTML = this.state.query.query;
        } else {
            this.state.query.entities.forEach((entity, i) => {
                const dummy = document.createElement("span"); // Create dummy div to render
                content.appendChild(dummy);
                var spaceNeeded = (i === this.state.query.entities.length - 1); // Add space between text segments

                ReactDOM.render(this.createEntitySegment(entity, spaceNeeded), dummy, () => {
                    if (entity.entity != null) {
                        var span = document.getElementById(entity.entity);
                        const dropdownDummy = document.createElement("span"); // Create dummy div to render
                        span.appendChild(dropdownDummy);
                        ReactDOM.render(this.createDropdown(this.state.query, entity), dropdownDummy);
                    }
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
            <div id="analysisView">
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
                    <span id="editableQuery" contentEditable={true} suppressContentEditableWarning={true}>{this.state.query.query}</span> :
                    <span id="nlpQuery"></span>
                }
            </div>
        )
    }
}
