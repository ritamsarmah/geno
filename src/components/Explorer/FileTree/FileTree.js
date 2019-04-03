import React, { Component } from 'react';
import { Treebeard, decorators } from 'react-treebeard';

import { faFolder, faFile, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './FileTree.css';

decorators.Toggle = () => (<span />); // no toggle
decorators.Header = ({ style, node }) => {
    return (
        <div className="headerBase">
            <div style={style.title}>
                <FontAwesomeIcon icon={node.children ? (node.toggled ? faFolderOpen : faFolder) : faFile} style={{ marginRight: "8px" }} /> 
                {node.name}
            </div>
        </div>
    );
};

export default class FileTree extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onToggle = this.onToggle.bind(this);
        this.animations = {
            toggle: ({ node: { toggled } }) => ({
                animation: { rotateZ: toggled ? 90 : 0 },
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
    }

    onToggle(node, toggled) {
        if (this.state.cursor) {
            this.state.cursor.active = false;
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
