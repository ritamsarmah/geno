import React, { Component } from 'react';
import { Treebeard, decorators } from 'react-treebeard';

import { faFolder, faFile, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './FileTree.css';

export default class FileTree extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onToggle = this.onToggle.bind(this);
        this.loadFile = this.loadFile.bind(this);

        this.animations = {
            toggle: ({ node: { toggled } }) => ({
                animation: null,
                duration: 0
            }),
            drawer: (/* props */) => ({
                enter: {
                    animation: 'slideDown',
                    duration: 0
                },
                leave: {
                    animation: 'slideUp',
                    duration: 0
                }
            })
        };

        decorators.Toggle = () => (<span />); // no toggle
        
        decorators.Header = ({ style, node }) => {
            var iconClass = node.children ? (node.toggled ? faFolderOpen : faFolder) : faFile;
            return (
                <div className="headerBase">
                    <div style={style.title} onClick={!node.children ? () => { this.loadFile(node.name) } : null}>
                        <FontAwesomeIcon icon={iconClass} style={{ marginRight: "8px" }} />
                        {node.name}
                    </div>
                </div>
            );
        };
    }

    loadFile(filePath) {
        console.log(filePath);
        this.setState({
            // TODO: update data with children!
        });
    }

    onToggle(node, toggled) {
        if (this.state.cursor) {
            var newCursor = this.state.cursor
            newCursor.active = false;
            this.setState({ cursor: newCursor })
        }
        node.active = true;
        if (node.children) {
            node.toggled = toggled;
        }
        this.setState({ cursor: node });
    }

    render() {
        return (
            <Treebeard
                data={this.props.data}
                decorators={decorators}
                animations={this.animations}
                onToggle={this.onToggle}
            />
        );
    }
}
