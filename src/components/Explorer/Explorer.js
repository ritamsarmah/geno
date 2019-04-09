import React, { Component } from 'react';
import FileTree from './FileTree/FileTree';
import CommandList from './CommandList/CommandList';

import { faMicrophone, faSearch, faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Colors } from '../../constants';

import './Explorer.css';

const data = {
    name: 'root',
    toggled: true,
    children: [
        {
            name: 'parent',
            children: [
                { name: 'child1' },
                { name: 'child2' }
            ]
        },
        {
            name: 'parent',
            children: [
                {
                    name: 'nested parent',
                    children: [
                        { name: 'nested child 1' },
                        { name: 'nested child 2' }
                    ]
                }
            ]
        }
    ]
};

export default class Explorer extends Component {
    constructor(props) {
        super(props);
        this.state = { tab: 1 } // 0 - File Tree, 1 - Voice Commands
        this.showFileTree = this.showFileTree.bind(this);
        this.showVoiceCommands = this.showVoiceCommands.bind(this);
        this.showSearch = this.showSearch.bind(this);
    }

    isTabEnabled(tabNumber) {
        const enabledColor = Colors.Highlight;
        const disabledColor = Colors.Disabled;
        return this.state.tab === tabNumber ? enabledColor : disabledColor;
    }

    showFileTree() {
        this.setState({ tab: 0 });
    }

    showVoiceCommands() {
        this.setState({ tab: 1 });
    }

    showSearch() {
        this.setState({ tab: 2 });
    }

    render() {
        var content;
        switch (this.state.tab) {
            case 0:
                content = (<div style={{ margin: "5px 10px" }}><FileTree data={data} /></div>);
                break;
            case 1:
                content = (<CommandList />); // TODO: pass in prop for project path
                break;
            case 2:
                content = (<div style={{ height: "100vh", backgroundColor: "orange" }}></div>);
                break;
            default:
                break;
        }

        return (
            <div>
                <div className="tabBar centered">
                    <div className="tabButton" onClick={this.showFileTree}>
                        <FontAwesomeIcon icon={faFolder} color={this.isTabEnabled(0)} />
                    </div>
                    <div className="tabButton" onClick={this.showVoiceCommands}>
                        <FontAwesomeIcon icon={faMicrophone} color={this.isTabEnabled(1)} />
                    </div>
                    <div className="tabButton" onClick={this.showSearch}>
                        <FontAwesomeIcon icon={faSearch} color={this.isTabEnabled(2)} />
                    </div>
                </div>
                {content}
            </div>
        );
    }
}
