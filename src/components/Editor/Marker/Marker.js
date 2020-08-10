import React, { Component } from "react";
import FunctionPopover from "../Popover/FunctionPopover";
import Tippy from "@tippy.js/react";
import builder from "../../../common/Builder";
import database from "../../../common/Database";
import emitter from "../../../common/Emitter";
import { GenoEvent } from "../../../common/constants";

import "./Marker.css";
import "tippy.js/themes/light-border.css";

export default class Marker extends Component {
  constructor(props) {
    super(props);

    var command = null;
    if (this.props.command != null) {
      // Use command passed in directly as prop
      command = this.props.command;
    } else {
      // Generate command information from editor info
      // Fill marker if voice command for the function already exists
      command = database.findCommand(this.props.file, this.props.triggerFn);

      // Check for changes to parameters list
      if (
        command != null &&
        JSON.stringify(this.props.params.sort()) !==
          JSON.stringify(command.parameters.map((p) => p.name).sort())
      ) {
        database.updateParameters(command.id, this.props.params);
      }
    }

    this.state = {
      command: command,
    };

    this.placement =
      this.props.placement == null ? "right-end" : this.props.placement;

    this.onHide = this.onHide.bind(this);
    this.onClick = this.onClick.bind(this);
    this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
  }

  onClick() {
    // Used for creation of new commands in editor
    if (this.state.command == null) {
      var command = database.addFunctionCommand(
        this.props.file,
        this.props.triggerFn,
        this.props.params
      );
      this.setState({ command: command });
    }
  }

  onHide() {
    emitter.emit(GenoEvent.StopTrackContext);
    document.body.style.setProperty("cursor", "inherit");
    builder.build();
  }

  handlePopoverUnmount(clearCommand = true) {
    if (clearCommand) {
      this.setState({ command: null });
    }
    document.body.click(); // Really hacky way to dismiss the popover
  }

  renderTippyContent() {
    return this.state.command != null ? (
      <FunctionPopover
        command={this.state.command}
        unmountMe={this.handlePopoverUnmount}
      />
    ) : (
      ""
    );
  }

  render() {
    var fillClass = this.state.command != null ? "filledMarker" : "emptyMarker";
    return (
      <Tippy
        content={this.renderTippyContent()}
        arrow={true}
        trigger="click"
        onHide={this.onHide}
        placement={this.placement}
        flipOnUpdate={true}
        theme="light-border"
        animation="scale"
        inertia={true}
        interactive={true}
      >
        <div className={fillClass} onClick={this.onClick}></div>
      </Tippy>
    );
  }
}
