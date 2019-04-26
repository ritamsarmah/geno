import React, { Component } from 'react';
import Split from 'react-split';
import Explorer from '../Explorer/Explorer';
import Editor from '../Editor/Editor';
import Preview from '../Preview/Preview';

import database from '../../common/Database';

import './App.css';
import { Paths, Context } from '../../common/constants'

const electron = window.require('electron');
const dialog = electron.remote.dialog;
const fs = window.require('fs');
const pjson = require('../../../package.json');
const path = require('path');


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dir: null, // Current project directory
      currentFile: null, // Current file in editor
      canSelectFile: true // Handle file saving/access (avoid losing unsaved changes)
    }
    this.openFileBrowser = this.openFileBrowser.bind(this);
    this.configureProject = this.configureProject.bind(this);
    this.selectFile = this.selectFile.bind(this);
    this.setSelectFile = this.setSelectFile.bind(this);
  }

  openFileBrowser() {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, this.configureProject);
  }

  /**
   * Creates .geno directory and necessary supporting files if it does not exist
   * Also loads project into file tree 
   **/
  configureProject(path) {
    if (!path) { return; }

    const genoPath = path[0] + Paths.Geno;
    const commandsPath = path[0] + Paths.Commands;

    database.configureProject(path[0]);

    fs.mkdir(genoPath, (err) => {
      fs.writeFile(commandsPath, "", { flag: 'wx' }, (err) => {
        this.setState({ dir: path[0] });
      });
    });

    // TODO: configure defaults in commandsPath using lowdb
    // db.defaults({ posts: [], user: {}, count: 0 })
    //   .write()
  }

  // Callback for FileTree in Explorer to set Editor file
  selectFile(filePath, toggleCallback) {
    if (this.state.canSelectFile) {
      this.setState({ currentFile: filePath });
      toggleCallback(true);
    } else {
      var oldFilePath = this.state.currentFile;
      if (oldFilePath === filePath) {
        toggleCallback(true);
        return;
      }
      dialog.showMessageBox({
        type: "warning",
        message: "Do you want to save the changes you made to " + path.basename(this.state.currentFile) + "?",
        detail: "Your changes will be lost if you don't save them.",
        buttons: ["Save", "Cancel", "Don't Save"]
      }, (response) => {
        switch (response) {
          case 0: // Save
            this.setState({
              currentFile: filePath,
              canSelectFile: true,
              forceSaveFile: true
            });
            toggleCallback(true);
            break;
          case 1: // Cancel
            toggleCallback(false);
            break;
          case 2: // Don't Save
            this.setState({
              currentFile: filePath,
              canSelectFile: true
            });
            toggleCallback(true);
            break;
        }
      });
      return false;
    }
  }

  // Callback for Editor to cancel new file selection if current file has unsaved changes
  setSelectFile(flag) {
    this.setState({
      canSelectFile: flag,
      forceSaveFile: false
    });
  }

  render() {
    if (this.state.dir) {
      return (
        <div className="App">
          <Split sizes={[20, 40, 40]} minSize={[0, 0, 0]}>
            <div className="split"><Explorer dir={this.state.dir} selectFile={this.selectFile} /></div>
            <div className="split"><Editor file={this.state.currentFile} setSelectFile={this.setSelectFile} forceSaveFile={this.state.forceSaveFile} /></div>
            <div className="split"><Preview dir={this.state.dir} /></div>
          </Split>
        </div>
      );
    } else {
      return (
        <div className="splash">
          <h1>Welcome to Geno</h1>
          <p>Version {pjson.version}</p>
          <br></br>
          <div className="openBtn" onClick={this.openFileBrowser}>Open Project</div>
        </div>
      );
    }
  }
}