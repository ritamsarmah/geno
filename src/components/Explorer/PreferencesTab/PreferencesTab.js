import React, { Component } from 'react';

import preferences from '../../../common/Preferences';

import './PreferencesTab.css';

const chokidar = window.require('chokidar');

export default class PreferencesTab extends Component {
    componentWillMount() {
        this.watcher = chokidar.watch(preferences.prefsPath).on('all', (event, path) => {
            this.forceUpdate()
        });
    }

    componentWillUnmount() {
        this.watcher.close();
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