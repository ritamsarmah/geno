import React, { Component } from 'react';
import tippy from 'tippy.js'

import { UnControlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';
import './Editor.css';

import { Colors } from '../../constants'

require('codemirror/mode/xml/xml');
require('codemirror/mode/javascript/javascript');

function makeMarker(type, id) {
    var marker = document.createElement("div");
    marker.style.color = Colors.Theme;
    marker.style.border = "1px solid" + Colors.Theme
    marker.style.borderRadius = "50%";
    marker.style.width = "12px";
    marker.style.height = "12px";
    marker.style.cursor = "pointer";
    marker.id = id
    switch (type) {
        case "filled":
            marker.style.backgroundColor = Colors.Theme;
            tippy(id, {
                content: "I'm a Tippy tooltip!",
                trigger: 'click',
                interactive: true
            });
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
        this.onChange = this.onChange.bind(this);
        this.onGutterClick = this.onGutterClick.bind(this);
    }

    onChange(editor, data, value) {
        for (let lineNumber = 0; lineNumber < editor.lineCount(); lineNumber++) {
            if (editor.getLine(lineNumber).includes("function")) {
                editor.doc.setGutterMarker(lineNumber, "commands", makeMarker("empty", lineNumber));

                var fnLines = this.state.fnLines
                fnLines[lineNumber] = true
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
            var info = editor.lineInfo(lineNumber)
            editor.doc.setGutterMarker(lineNumber, gutter, makeMarker("filled", lineNumber));
        }
    }

    render() {
        const code = this.state.code;
        return (
            <div height="auto">
                <CodeMirror
                    value={this.state.code}
                    options={{
                        theme: "base16-dark",
                        mode: "javascript",
                        lineNumbers: true,
                        gutters: ["commands"]
                    }}
                    onChange={this.onChange}
                    onGutterClick={this.onGutterClick}
                />
            </div>
        );
    }
}