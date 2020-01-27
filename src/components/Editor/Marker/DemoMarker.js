import React, { Component } from 'react';
import DemoPopover from '../Popover/DemoPopover';
import Tippy from '@tippy.js/react';

import database from '../../../common/Database';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class DemoMarker extends Component {
    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
        this.state = {
            isVisible: false
        }
    }

    onClick() {
        this.setState({
            isVisible: !this.state.isVisible
        });
    }

    handlePopoverUnmount() {
        this.setState({
            command: null,
            isVisible: false,
        });
    }

    render() {
        var content = (this.props.command != null) ? (<DemoPopover command={this.props.command} unmountMe={this.handlePopoverUnmount} />) : (<span></span>);
        var fillClass = (this.props.command != null) ? "filledMarker" : "emptyMarker";
        return (
            <Tippy content={content} arrow={true} trigger="click" placement="right-end" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.isVisible}>
                <div className={fillClass} onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


