import React from 'react';
import Popover from '../Popover/Popover';
import Marker from './Marker';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class ListMarker extends Marker {
    constructor(props) {
        super(props);
        this.placement = "top-end";
    }

    renderTippyContent() {
        return (this.state.command != null) ? (<Popover command={this.state.command} unmountMe={this.handlePopoverUnmount} />) : (<span></span>);
    }
}
