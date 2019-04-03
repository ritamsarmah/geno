import React, { Component } from 'react';
import Split from 'react-split';
import Explorer from '../Explorer/Explorer';
import Editor from '../Editor/Editor';
import Preview from '../Preview/Preview';

import './App.css';
import { Colors } from '../../constants'

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <Split sizes={[20, 40, 40]} minSize={[0, 0, 0]}>
          <div className="split" style={{ backgroundColor: Colors.Background }}><Explorer /></div>
          <div className="split"><Editor /></div>
          <div className="split" style={{ backgroundColor: Colors.Background }}><Preview /></div>
        </Split>
      </div>
    );
  }
}