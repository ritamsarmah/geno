import React from 'react';
import DemoPopover from '../Popover/DemoPopover';
import Marker from './Marker';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class DemoMarker extends Marker {
    renderTippyContent() {
        return (<DemoPopover command={this.state.command} flipSide={false} unmountMe={this.handlePopoverUnmount} />);
    }
}
