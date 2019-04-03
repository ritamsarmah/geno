import React, { Component, forwardRef } from 'react';
import ReactDOM from 'react-dom';
import Marker from './Marker/Marker';

import { UnControlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';

import './Editor.css';

import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';

function makeAnchor(type) {
    var marker = document.createElement("div");
    marker.style.width = "12px";
    marker.style.height = "12px";
    marker.style.backgroundColor = "clear";
    return marker;
}

export default class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            markers: {}
        }
        this.editorDidMount = this.editorDidMount.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    editorDidMount(editor) {
        this.addGutterCircles(editor);
    }

    onChange(editor, data, value) {
        // TODO: commands reset is temporary for testing (REMOVE!!)
        this.setState({ markers: {} });
        this.addGutterCircles(editor);
    }

    // Redraw all circles for lines with function declarations
    addGutterCircles(editor) {
        for (let lineNumber = 0; lineNumber < editor.lineCount(); lineNumber++) {
            if (editor.getLine(lineNumber).includes("function")) {
                // CodeMirror API can't set markers as components, so add anchor and render manually
                var anchor = makeAnchor();
                editor.doc.setGutterMarker(lineNumber, "commands", anchor);

                // TODO: Map to correct function name
                var marker = <Marker triggerFns={["hello", "world"]} />;
                ReactDOM.render(marker, anchor);

                var markers = this.state.markers;
                markers[lineNumber] = true;
                // TODO: need a better way to map functions with command bubbles instead of lineNumbers (maybe look at function declaration with a smarter syntax parsing)
                this.setState({ markers: markers });
            } else {
                editor.doc.setGutterMarker(lineNumber, "commands", null);

                var markers = this.state.markers;
                delete markers[lineNumber];
                this.setState({ markers: markers });
            }
        }
    }

    render() {
        const code = this.state.code;
        return (
            <div>
                <div className="filename centered">
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
                />
            </div>
        );
    }
}