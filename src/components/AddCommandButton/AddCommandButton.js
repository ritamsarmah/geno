import React, { Component } from 'react';
import UniversalPopover from '../Editor/Popover/UniversalPopover';
import Tippy from '@tippy.js/react';
import database from '../../common/Database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import './AddCommandButton.css';

export default class AddCommandButton extends Component {

    constructor(props) {
        super(props);

        this.state = {
            command: database.getCommandPrototype("function", [])
        };

        this.onShow = this.onShow.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
    }

    onShow() {
        this.setState({
            command: database.getCommandPrototype("function", [])
        });
    }

    handlePopoverUnmount() {
        this.setState({
            command: null
        });
        document.body.click(); // Really hacky way to dismiss the popover
        this.props.onCreateCommand()
    }

    render() {
        return (
            <Tippy
                content={<UniversalPopover relativePath={this.props.relativePath} file={this.props.file} command={this.state.command} unmountMe={this.handlePopoverUnmount} />}
                arrow={true}
                trigger="click"
                placement="auto"
                theme="light-border"
                flipOnUpdate={true}
                animation="scale"
                inertia={true}
                interactive={true}
                onShow={this.onShow}>
                <div id="newCommandBtn">
                    <FontAwesomeIcon title="Create Function Intent" icon={faPlus}></FontAwesomeIcon>
                </div>
            </Tippy>
        );
    }

}