import React from 'react';
import Popover from '../Popover/Popover';
import Tippy from '@tippy.js/react';
import Marker from './Marker';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class ListMarker extends Marker {
    render() {
        var content = (this.state.command != null) ? (<Popover command={this.state.command} unmountMe={this.handlePopoverUnmount} />) : (<span></span>);
        var fillClass = (this.state.command != null) ? "filledMarker" : "emptyMarker";
        return (
            <Tippy content={content} arrow={true} trigger="click" placement="top-end" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.isVisible}>
                <div className={fillClass} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


