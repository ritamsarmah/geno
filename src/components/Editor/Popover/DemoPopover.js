import React from "react";
import FunctionPopover from "./FunctionPopover";
import database from "../../../common/Database";

import "./Popover.css";

export default class DemoPopover extends FunctionPopover {
  constructor(props) {
    super(props);
    this.state.flipSide = this.props.flipSide;
  }

  bindFunctions() {
    super.bindFunctions();
    this.changeDelay = this.changeDelay.bind(this);
  }

  /* Change delay for demo command */
  changeDelay(event) {
    var delay = event.target.value;
    this.setState({
      command: database.updateDelay(this.state.command.id, delay),
    });
  }

  renderOptions() {
    return (
      <div>
        <div className="popover">
          <form className="popoverForm">
            <p className="popoverTitle">Click Delay</p>
            <p className="popoverSubtitle">
              Delay in seconds before clicking elements
            </p>
            <input
              type="text"
              defaultValue={this.state.command.delay}
              onChange={(event) => this.changeDelay(event)}
            ></input>
          </form>
          <input type="button" value="Done" onClick={this.showMain}></input>
        </div>
      </div>
    );
  }
}
