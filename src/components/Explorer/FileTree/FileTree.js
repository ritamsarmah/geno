import React, { Component } from "react";
import { Treebeard, decorators } from "react-treebeard";

import {
  faFolder,
  faFolderOpen,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./FileTree.css";

export default class FileTree extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onToggle = this.onToggle.bind(this);

    this.animations = {
      toggle: ({ node: { toggled } }) => ({
        animation: null,
        duration: 0,
      }),
      drawer: (/* props */) => ({
        enter: {
          animation: "slideDown",
          duration: 0,
        },
        leave: {
          animation: "slideUp",
          duration: 0,
        },
      }),
    };

    decorators.Toggle = () => <span />; // no toggle

    decorators.Header = ({ style, node }) => {
      var iconClass = node.children
        ? node.toggled
          ? faFolderOpen
          : faFolder
        : faFileAlt;
      var titleClass = this.validNode(node) ? "validFile" : "invalidFile";
      var toggledClass =
        titleClass === "validFile" && node.active ? " selected" : "";
      return (
        <div className={"headerBase" + toggledClass}>
          <div className={titleClass} style={style.title}>
            <FontAwesomeIcon icon={iconClass} style={{ marginRight: "8px" }} />
            {node.name}
          </div>
        </div>
      );
    };
  }

  componentWillUnmount() {
    const { cursor } = this.state;

    if (cursor) {
      cursor.active = false;
    }
  }

  // Directory or JavaScript/TypeScript File
  validNode(node) {
    return ["dir", ".js", ".ts", ".html", ".htm", ".css", ".json"].includes(
      node.type
    );
  }

  onToggle(node, toggled) {
    if (this.validNode(node)) {
      if (node.type !== "dir") {
        this.props.selectFile(node.path, (shouldToggle) => {
          if (shouldToggle) {
            const { cursor } = this.state;
            if (cursor) cursor.active = false;

            node.active = true;
            if (node.children) node.toggled = toggled;

            this.setState({ cursor: node });
          }
        });
      } else {
        const { cursor } = this.state;
        if (cursor) cursor.active = false;

        node.active = true;
        if (node.children) node.toggled = toggled;

        this.setState({ cursor: node });
      }
    }
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
