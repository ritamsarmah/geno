import React, { Component } from 'react';
import Split from 'react-split';
import Explorer from '../Explorer/Explorer';
import Editor from '../Editor/Editor';
import Preview from '../Preview/Preview';

import './App.css';
import { Colors, Paths } from '../../constants'

const electron = window.require('electron');
const app = electron.remote.app;
const dialog = electron.remote.dialog;
const fs = window.require('fs');
const pjson = require('../../../package.json');

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dir: null // stores current project dir
    }
    this.openFileBrowser = this.openFileBrowser.bind(this);
    this.configureProject = this.configureProject.bind(this);
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

    this.setState({ dir: path[0] }); // TODO: remove this line and uncomment bottom section
    // fs.mkdir(genoPath, (err) => {
    //   if (err) { console.log(err); }

    //   fs.writeFile(commandsPath, "blah", (err) => {
    //     if (err) { console.log(err); }
    //     this.setState({ dir: path[0] });
    //   });
    // });
  }

  render() {
    if (this.state.dir) {
      return (
        <div className="App">
          <Split sizes={[20, 40, 40]} minSize={[0, 0, 0]}>
            <div className="split"><Explorer dir={this.state.dir}/></div>
            <div className="split"><Editor /></div>
            <div className="split"><Preview dir={this.state.dir}/></div>
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