import React, { Component } from 'react';

import preferences from '../../../common/Preferences';

import './PreferencesTab.css';

const chokidar = window.require('chokidar');

export default class PreferencesTab extends Component {
    constructor(props) {
        super(props);
        chokidar.watch(preferences.prefsPath).on('all', (event, path) => {
            this.forceUpdate()
        });
    }

    render() {
        return (
            <div className="prefsList">
                <form id="prefsForm">
                    <label>Developer ID</label>
                    <input className="pill" defaultValue={preferences.getDevId()} onChange={(event) => preferences.setDevId(event.target.value)}></input>
                </form>
                {/* <p>dev_id: {preferences.getDevId()}</p>
                <p>API KEY</p>
                <p>Continuous listening vs. manual</p> */}
            </div>
        );
    }
}