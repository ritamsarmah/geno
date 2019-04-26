import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faSyncAlt, faPen } from '@fortawesome/free-solid-svg-icons';

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
        this.onQueryChange = this.onQueryChange.bind(this);
        this.updateNLPInfo = this.updateNLPInfo.bind(this);
        this.toggleEdit = this.toggleEdit.bind(this);
        this.spinRefresh = this.spinRefresh.bind(this);
    }

    componentDidMount() {
        this.updateNLPInfo();
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            query: newProps.query,
            editMode: false
        }, () => {
            this.updateNLPInfo();
        });
    }

    /* Event listener for editing query text */
    onQueryChange() {
        var content = document.getElementById("editableQuery");
        this.state.query.query = content.innerHTML;
    }

    /* Dismisses this component, passing back any updates to query */
    dismiss() {
        this.props.unmountMe(this.state.query);
    }

    /* Deletes query and dismisses this component */
    delete() {
        this.props.deleteQuery(this.state.query);
        this.dismiss();
    }

    /* Create text segment for NLP information */
    createEntitySegment(entity, finalSegment) {
        return (
            <span id={entity.name} className="textSegment" style={{ color: utils.stringToColor(entity.name) }} onFocus={this.removeHighlights}>
                {this.state.query.query.substring(entity.start, entity.end) + (finalSegment ? "" : " ")}
            </span>
        )
    }

    /* Toggles edit mode */
    toggleEdit() {
        this.setState({ editMode: !this.state.editMode },
            () => {
                if (!this.state.editMode) {
                    this.updateNLPInfo();
                }
            }
        );
    }

    /* Sets colored underlines under query representing NLP entity */
    updateNLPInfo() {
        this.spinRefresh(true);

        var content = document.getElementById("nlpQuery");
        content.innerHTML = "";

        var newQuery = this.state.query; //  TODO: Retrieve new analysis of query from server

        if (newQuery.entities.length == 0) {
            content.innerHTML = newQuery.query;
        } else {
            var options = this.props.parameters.map(p => p.name);
            options.push("intent");

            newQuery.entities.forEach((entity, i) => {
                const dummy = document.createElement("span"); // Create dummy div to render
                content.appendChild(dummy);
                var spaceNeeded = (i == newQuery.entities.length - 1); // Add space between text segments
                var segment = this.createEntitySegment(entity, spaceNeeded);

                // Render and add dropdown
                ReactDOM.render(segment, dummy, () => {
                    var span = document.getElementById(entity.name);

                    var dropdown = document.createElement("select");
                    options.forEach(opt => {
                        // TODO: create id so we can reaccess option to change data
                        var option = document.createElement("option");
                        option.value = opt;
                        option.innerHTML = opt;
                        dropdown.append(option);
                    });

                    options.forEach((opt, i) => {
                        if (opt === entity.name) {
                            dropdown.selectedIndex = i;
                            return;
                        }
                    });
                    span.appendChild(dropdown);
                });
            });
        }

        this.spinRefresh(false);
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
                    <span id="editableQuery" contentEditable={true} onInput={this.onQueryChange}>{this.state.query.query}</span> :
                    <span id="nlpQuery"></span>
                }
            </div>
        )
    }
}
