import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Marker from './Marker/Marker';

import { UnControlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';
import './Editor.css';

import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';

const fs = window.require('fs');
const path = require('path');

var acorn = require("acorn-loose/dist/acorn-loose.js");

function makeAnchor(type) {
    var marker = document.createElement("div");
    marker.style.width = "12px";
    marker.style.height = "12px";
    marker.style.backgroundColor = "clear";
    return marker;
}

function extractFunctions(code) {
    try {
        var results = acorn.parse(code, { locations: true });
        if (results.sourceType === "script") {
            return astSearch(results);
        }
    } catch (e) {
        console.log(e);
        return [];
    }
}

function astSearch(node) {
    var functions = [];

    // Function Declaration
    if (node.type === "FunctionDeclaration") {
        functions.push({
            name: node.id.name,
            params: node.params.map(param => param.name),
            lineNumber: node.loc.start.line
        });
    } else if (node.type === "VariableDeclaration") {
        if ("declarations" in node && node.declarations[0].type === "VariableDeclarator") {
            var declarator = node.declarations[0]

            if ("init" in declarator && declarator.init != null) {
                // Function Expressions
                if (declarator.init.type === "FunctionExpression" || declarator.init.type === "ArrowFunctionExpression") {
                    var expression = declarator.init;
                    functions.push({
                        name: declarator.id.name,
                        params: expression.params.map(param => param.name),
                        lineNumber: declarator.loc.start.line
                    });
                    // Constructor
                } else if ("callee" in declarator.init && declarator.init.callee.name === "Function") {
                    functions.push({
                        name: declarator.id.name,
                        params: declarator.init.arguments.slice(0, declarator.init.arguments.length - 1).map(arg => arg.value),
                        lineNumber: declarator.loc.start.line
                    });
                }
            }
        }
    }

    // Arrow Functions

    if ("body" in node) {
        for (let i = 0; i < node.body.length; i++) {
            functions = functions.concat(astSearch(node.body[i]));
        }
    }

    return functions;
}

export default class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            lastSavedText: null,
            currentText: null
        }
        this.editorDidMount = this.editorDidMount.bind(this);
        this.onChange = this.onChange.bind(this);
        this.saveFile = this.saveFile.bind(this);
        this.codeMirror = null;
    }

    editorDidMount(editor) {
        this.addGutterCircles(editor);
        this.codeMirror = editor;
    }

    componentDidUpdate(prevProps) {
        // File change
        if (this.state.file !== this.props.file) {
            // Save previous file
            if (this.props.forceSaveFile) {
                this.saveFile(this.state.file, false);
            }
            this.setState({
                file: this.props.file
            }, () => {
                this.readFile(this.props.file);
            });
        }
    }

    readFile(file) {
        fs.readFile(file, "utf8", (err, data) => {
            this.setState({
                lastSavedText: data,
                currentText: data
            });
            console.log(this.codeMirror.doc.clearHistory());
            this.props.setSelectFile(true);
        });
    }

    saveFile(file, trackLastSave) {
        var data = this.state.currentText;
        fs.writeFile(file, data, 'utf8', (err) => {
            if (err) alert(err);
            if (trackLastSave) {
                this.setState({ lastSavedText: data });
            }
            this.props.setSelectFile(true);
        });
    }

    onChange(editor, data, value) {
        this.addGutterCircles(editor);
        this.setState({ currentText: value });
        if (this.state.lastSavedText !== this.state.currentText) {
            document.getElementById("saveButton").style.color = "gray";
            this.props.setSelectFile(false);
        } else {
            document.getElementById("saveButton").style.color = "white";
            this.props.setSelectFile(true);
        }
    }

    // Redraw all circles for lines with function declarations
    addGutterCircles(editor) {
        editor.doc.clearGutter("commands");

        extractFunctions(editor.getValue()).forEach(f => {
            var anchor = makeAnchor();
            editor.doc.setGutterMarker(f.lineNumber - 1, "commands", anchor);

            // Use file path relative to project directory for project portability
            var file = path.relative(this.props.dir, this.state.file);
            var marker = <Marker file={file} triggerFn={f.name} params={f.params} />;
            ReactDOM.render(marker, anchor);
        });
    }

    render() {
        if (this.state.file) {
            return (
                <div>
                    <div className="filename centered">
                        <span id="saveButton" style={{ color: "white" }} onClick={() => this.saveFile(this.state.file, true)}>
                            <FontAwesomeIcon icon={faSave} size="lg" />
                        </span>
                        {path.basename(this.state.file)}
                    </div>
                    <CodeMirror
                        value={this.state.lastSavedText}
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
        } else {
            return (
                <div className="noFileScreen">
                    <p>Select a file from the explorer</p>
                </div>
            );
        }
    }
}