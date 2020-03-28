import React, { Component } from 'react';
import UniversalPopover from '../Editor/Popover/UniversalPopover';
import Tippy from '@tippy.js/react';
import database from '../../common/Database';
import emitter from '../../common/Emitter';
import { GenoEvent } from '../../common/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import './AddCommandButton.css';

export default class AddCommandButton extends Component {

    constructor(props) {
        super(props);

        this.state = {
            command: database.getCommandPrototype(undefined, [{
                name: 'test',
                backupQuery: ''
            }])
        };

        this.onShow = this.onShow.bind(this);
        this.handlePopoverUnmount = this.handlePopoverUnmount.bind(this);
    }

    onShow() {
        this.setState({
            command: database.getCommandPrototype(undefined, [{
                name: 'test',
                backupQuery: ''
            }])
        });
    }

    handlePopoverUnmount() {
        this.setState({
            command: null,
        });
        document.body.click(); // Really hacky way to dismiss the popover
    }

    render() {
        return (
            <Tippy
                content={<UniversalPopover command={this.state.command} unmountMe={this.handlePopoverUnmount} />}
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
                    <FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
                </div>
            </Tippy>
        );
    }

}