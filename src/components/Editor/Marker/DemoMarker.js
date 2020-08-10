import React from "react";
import DemoPopover from "../Popover/DemoPopover";
import Marker from "./Marker";

export default class DemoMarker extends Marker {
  renderTippyContent() {
    return (
      <DemoPopover
        command={this.state.command}
        flipSide={false}
        unmountMe={this.handlePopoverUnmount}
      />
    );
  }
}
