import React, { Component } from 'react';
import FileTree from '../FileTree/FileTree'

import { faMicrophone, faSearch, faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Colors } from '../../constants'

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
        this.state = { tab: 0 } // 0 - File Tree, 1 - Voice Commands
        this.showFileTree = this.showFileTree.bind(this);
        this.showVoiceCommands = this.showVoiceCommands.bind(this);
        this.showSearch = this.showSearch.bind(this);
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
                content = (<div style={{ height: "100vh", backgroundColor: "blue" }}></div>);
                break;
            case 2:
                content = (<div style={{ height: "100vh", backgroundColor: "orange" }}></div>);
                break;
            default:
                break;
        }

        const enabledColor = Colors.Highlight;
        const disabledColor = Colors.Disabled;

        return (
            <div>
                <div style={{ top: "0", position: "relative", padding: "11px", backgroundColor: Colors.LightBackground }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <button style={{ all: "unset", cursor: "pointer" }} onClick={this.showFileTree}>
                            <FontAwesomeIcon icon={faFolder} color={this.state.tab == 0 ? enabledColor : disabledColor} />
                        </button>
                        <button style={{ all: "unset", marginLeft: "35px", cursor: "pointer" }} onClick={this.showVoiceCommands}>
                            <FontAwesomeIcon icon={faMicrophone} color={this.state.tab == 1 ? enabledColor : disabledColor} />
                        </button>
                        <button style={{ all: "unset", marginLeft: "35px", cursor: "pointer" }} onClick={this.showSearch}>
                            <FontAwesomeIcon icon={faSearch} color={this.state.tab == 2 ? enabledColor : disabledColor} />
                        </button>
                    </div>
                </div>
                {content}
            </div>
        );
    }
}
