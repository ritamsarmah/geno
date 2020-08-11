import React, { Component } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faTrashAlt,
  faSyncAlt,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

import database from "../../../common/Database";
import utils from "../../../common/utils";

import "./AnalysisView.css";

const prompt = window.require("electron-prompt");

export default class AnalysisView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: this.props.query,
      editMode: false, // Editing text vs. displaying NLP info
    };
    this.dismiss = this.dismiss.bind(this);
    this.delete = this.delete.bind(this);
    this.updateNLPInfo = this.updateNLPInfo.bind(this);
    this.colorEntities = this.colorEntities.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.spinRefresh = this.spinRefresh.bind(this);
    this.onChangeEntity = this.onChangeEntity.bind(this);

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
    this.setState(
      {
        query: newProps.query,
        editMode: false,
      },
      () => {
        this.colorEntities();
      }
    );
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
    var color =
      entity.label != null ? utils.stringToColor(entity.label) : "lightgray";
    var marginRight = finalSegment ? "0px" : "10px";
    return (
      <span
        id={`entity-${entity.start}`}
        className="textSegment"
        style={{ borderBottomColor: color, marginRight: marginRight }}
        onFocus={this.removeHighlights}
      >
        {entity.text}
      </span>
    );
  }

  /* Update entity label */
  onChangeEntity(entity, event) {
    switch (event.target.value) {
      case "+ Add Parameter":
        prompt({
          title: "Add Parameter",
          label: "Enter parameter name:",
          type: "input",
        }).then((newParameter) => {
          if (newParameter != null) {
            if (!this.props.command.parameters.includes(newParameter)) {
              this.props.command.parameters.push({
                name: newParameter,
                backupQuery: "",
              });
              this.updateEntity(entity, newParameter);
            }
          } else {
            this.updateEntity(entity, null);
          }
        });
        break;
      case "-":
        this.updateEntity(entity, null);
        break;
      default:
        this.updateEntity(entity, event.target.value);
    }
  }

  /* Update entity label */
  updateEntity(entity, label) {
    if (this.props.updatesDatabase) {
      database.updateEntity(
        this.props.command.id,
        this.state.query.id,
        entity,
        label
      );
    } else {
      // eslint-disable-next-line
      this.state.query.entities[entity.start].label = label;
    }
    this.colorEntities();
  }

  /* Create dropdown for text segment */
  createDropdown(entity) {
    var color = utils.stringToColor(entity.label);

    var names = this.props.command.parameters.map((p) => p.name);
    names.unshift("-");

    if (!this.props.updatesDatabase) {
      names.push("+ Add Parameter");
    }

    var selection = entity.label != null ? entity.label : "-";

    return (
      <select
        className="entitySelect"
        id={`select-entity-${entity.start}`}
        data-curr={selection}
        defaultValue={selection}
        style={{ color: color }}
        onChange={(event) => this.onChangeEntity(entity, event)}
      >
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    );
  }

  /* Toggles edit mode */
  toggleEdit() {
    // Update NLP info and complete before changing icon
    if (this.state.editMode) {
      var content = document.getElementById("editableQuery");
      this.updateNLPInfo(content.innerHTML);
    } else {
      this.setState((state, _props) => ({ editMode: !state.editMode }));
    }
  }

  /* Updates entity coloring based on new analysis */
  updateNLPInfo(newText) {
    this.spinRefresh(true);
    var oldText = this.state.query.text;

    this.props.updateQuery(
      this.state.query.id,
      oldText,
      newText,
      (updatedQuery) => {
        this.setState(
          {
            query: updatedQuery,
            editMode: false,
          },
          () => {
            this.colorEntities();
            this.spinRefresh(false);
          }
        );
      }
    );
  }

  /* Sets colored underlines under query representing NLP entity */
  colorEntities() {
    var content = document.getElementById("nlpQuery");
    if (!content) return;

    content.innerHTML = "";

    var entityCount = Object.keys(this.state.query.entities).length;

    if (entityCount === 0) {
      content.innerHTML = this.state.query.text;
    } else {
      const maxWidth = 28;
      var lineWidth = 0;
      Object.keys(this.state.query.entities).forEach((index, i) => {
        var entity = this.state.query.entities[index];

        // Create dummy element to render
        if (lineWidth + entity.text.length > maxWidth) {
          var br = document.createElement("br");
          content.appendChild(br);
          lineWidth = entity.text.length;
        } else {
          lineWidth += entity.text.length;
        }

        const dummy = document.createElement("span"); // Create dummy div to render
        content.appendChild(dummy);

        const spaceNeeded = i === entityCount - 1; // Add space between text segments

        ReactDOM.render(
          this.createEntitySegment(entity, spaceNeeded),
          dummy,
          () => {
            var span = document.getElementById(`entity-${entity.start}`);
            const dropdownDummy = document.createElement("span"); // Create dummy div to render
            span.appendChild(dropdownDummy);
            ReactDOM.render(this.createDropdown(entity), dropdownDummy);
          }
        );
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
          <FontAwesomeIcon
            icon={this.state.editMode ? faSyncAlt : faPen}
          ></FontAwesomeIcon>
        </div>
        <div id="delete" onClick={this.delete}>
          <FontAwesomeIcon icon={faTrashAlt}></FontAwesomeIcon>
        </div>
        {this.state.editMode ? (
          <span
            id="editableQuery"
            contentEditable={true}
            suppressContentEditableWarning={true}
          >
            {this.state.query.text}
          </span>
        ) : (
          <span id="nlpQuery"></span>
        )}
      </div>
    );
  }
}
