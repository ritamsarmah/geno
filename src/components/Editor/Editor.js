import React, { Component } from 'react';
import tippy from 'tippy.js'

import { UnControlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';

import './Editor.css';
import 'tippy.js/themes/light-border.css'

import { Colors } from '../../constants'

require('codemirror/mode/xml/xml');
require('codemirror/mode/javascript/javascript');


// TODO: Remove and relocate to model component
var commands = []

function makeMarker(type, id) {
    var marker = document.createElement("div");
    marker.style.color = Colors.Theme;
    marker.style.border = "1px solid" + Colors.Theme
    marker.style.borderRadius = "50%";
    marker.style.width = "12px";
    marker.style.height = "12px";
    marker.style.cursor = "pointer";
    marker.title = id;
    switch (type) {
        case "filled":
            marker.style.backgroundColor = Colors.Theme;
            break;
        case "empty":
            marker.style.backgroundColor = "clear";
            break;
        default:
            break;
    }
    
    return marker;
}

export default class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fnLines: {}
        }
        this.editorDidMount = this.editorDidMount.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onGutterClick = this.onGutterClick.bind(this);
    }

    editorDidMount(editor) {
        this.addGutterCircles(editor);
    }

    onChange(editor, data, value) {
        // TODO: commands reset is temporary for testing (REMOVE!!)
        commands = []
        this.addGutterCircles(editor);
    }

    addGutterCircles(editor) {
        for (let lineNumber = 0; lineNumber < editor.lineCount(); lineNumber++) {
            if (editor.getLine(lineNumber).includes("function")) {
                editor.doc.setGutterMarker(lineNumber, "commands", makeMarker("empty", lineNumber));

                var fnLines = this.state.fnLines
                fnLines[lineNumber] = true
                // TODO: need a better way to map functions with command bubbles instead of lineNumbers (maybe look at function declaration with a smarter syntax parsing)
                this.setState({ fnLines: fnLines })
            } else {
                editor.doc.setGutterMarker(lineNumber, "commands", null);

                var fnLines = this.state.fnLines
                delete fnLines[lineNumber]
                this.setState({ fnLines: fnLines })
            }
        }
    }

    onGutterClick(editor, lineNumber, gutter, event) {
        if (gutter === "commands" && this.state.fnLines[lineNumber]) {
            if (!commands.includes(lineNumber)) {
                var marker = makeMarker("filled", lineNumber)
                editor.doc.setGutterMarker(lineNumber, gutter, marker);

                console.log("tippy added");
                tippy(marker, {
                    content: "I'm a Tippy tooltip for " + lineNumber,
                    arrow: true,
                    trigger: 'click',
                    placement: 'right',
                    theme: 'light-border',
                    animation: 'scale',
                    inertia: true,
                    interactive: true,
                });

                commands.push(lineNumber)
                // TODO: Create voice command for the function
            }
        }
    }

    render() {
        const code = this.state.code;
        return (
            <div>
                <div style={{ height: "40px", backgroundColor: Colors.EditorBackground, display: "flex", justifyContent: "center", alignItems: "center", fontSize: "12px", color: "white"}}>
                    long_file_name.js
                </div>
                <CodeMirror
                    value="function hello() { return 'world' }"
                    options={{
                        theme: "base16-dark",
                        mode: "javascript",
                        lineNumbers: true,
                        gutters: ["commands"]
                    }}
                    editorDidMount={this.editorDidMount}
                    onChange={this.onChange}
                    onGutterClick={this.onGutterClick}
                />
            </div>
        );
    }
}