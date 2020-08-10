import React, { Component } from "react";
import FileTree from "./FileTree/FileTree";
import CommandList from "./CommandList/CommandList";
import PreferencesTab from "./PreferencesTab/PreferencesTab";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faFolder,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { Colors } from "../../common/constants";

import "./Explorer.css";

const fs = window.require("fs");
const path = require("path");
const chokidar = window.require("chokidar");

export default class Explorer extends Component {
  constructor(props) {
    super(props);
    this.state = { tab: 0 }; // 0 - File Tree, 1 - Voice Commands, 2 - Settings

    this.showFileTree = this.showFileTree.bind(this);
    this.showVoiceCommands = this.showVoiceCommands.bind(this);
    this.showSettings = this.showSettings.bind(this);
    this.walkDone = this.walkDone.bind(this);

    this.walk(this.props.dir, this.walkDone);

    this.watcher = chokidar.watch(this.props.dir);
    this.watcher
      .on("add", () => this.walk(this.props.dir, this.walkDone))
      .on("unlink", () => this.walk(this.props.dir, this.walkDone))
      .on("addDir", () => this.walk(this.props.dir, this.walkDone))
      .on("unlinkDir", () => this.walk(this.props.dir, this.walkDone));
  }

  walk(dir, done) {
    var results = [];
    fs.readdir(dir, (err, files) => {
      if (err) return done(err);

      var pending = files.length;

      if (!pending)
        return done(null, {
          path: path,
          name: path.basename(dir),
          type: "dir",
          children: results,
        });

      files.forEach((file) => {
        file = path.resolve(dir, file);
        fs.stat(file, (err, stat) => {
          if (
            stat &&
            stat.isDirectory() &&
            path.basename(file) !== "node_modules"
          ) {
            this.walk(file, (err, res) => {
              results.push({
                path: path,
                name: path.basename(file),
                type: "dir",
                children: res,
              });
              if (!--pending) done(null, results);
            });
          } else {
            results.push({
              path: file,
              name: path.basename(file),
              type: path.extname(file),
            });
            if (!--pending) done(null, results);
          }
        });
      });
    });
  }

  walkDone(err, results) {
    results.sort((a, b) => {
      if (a.type === "dir" && b.type !== "dir") {
        return -1;
      } else if (b.type === "dir" && a.type !== "dir") {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });
    this.setState({
      dirData: results,
    });
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

  showSettings() {
    this.setState({ tab: 2 });
  }

  render() {
    var content;
    switch (this.state.tab) {
      case 0:
        if (this.state.dirData) {
          content = (
            <div style={{ margin: "10px 20px" }}>
              <FileTree
                data={this.state.dirData}
                selectFile={this.props.selectFile}
              />
            </div>
          );
        } else {
          content = (
            <div className="loading">
              <p className="loadingText">Loading...</p>
            </div>
          );
        }
        break;
      case 1:
        content = <CommandList />;
        break;
      case 2:
        content = <PreferencesTab />;
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
          <div className="tabButton" onClick={this.showSettings}>
            <FontAwesomeIcon icon={faCog} color={this.isTabEnabled(2)} />
          </div>
        </div>
        {content}
      </div>
    );
  }
}
