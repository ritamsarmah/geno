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
                <div id="prefsForm">
                    <label className="prefsLabel">Developer ID</label>
                    <input className="prefsInput" defaultValue={preferences.getDevId()} onChange={(event) => preferences.setDevId(event.target.value)}></input>
                    {/* <p>dev_id: {preferences.getDevId()}</p>
                <p>API KEY</p>
                <p>Continuous listening vs. manual</p> */}
                </div>
            </div>
        );
    }
}