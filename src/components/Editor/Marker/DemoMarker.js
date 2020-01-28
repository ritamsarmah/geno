import React, { Component } from 'react';
import DemoPopover from '../Popover/DemoPopover';
import Tippy from '@tippy.js/react';

import './Marker.css'
import 'tippy.js/themes/light-border.css';

export default class DemoMarker extends Component {
    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
        this.state = {
            isVisible: false
        };
    }

    onClick() {
        this.setState({ isVisible: !this.state.isVisible });
    }

    handlePopoverUnmount() {
        this.setState({ isVisible: false });
    }

    render() {
        var content = (<DemoPopover command={this.props.command} unmountMe={this.handlePopoverUnmount} />);
        return (
            <Tippy content={content} arrow={true} trigger="click" placement="top-end" theme="light-border" animation="scale" inertia={true} interactive={true} isVisible={this.state.isVisible} onHidden={this.handlePopoverUnmount}>
                <div className="filledMarker" onClick={this.onClick}></div>
            </Tippy>
        );
    }
}


