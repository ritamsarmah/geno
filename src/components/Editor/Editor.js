import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Marker from './Marker/Marker';
import AddCommandButton from '../AddCommandButton/AddCommandButton';
import database from '../../common/Database';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';

// Styles
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';
import 'codemirror/addon/dialog/dialog.css';
import './Editor.css';

// Language support
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/css/css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';

// Addons
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/closebrackets';
// import 'codemirror/addon/hint/show-hint';
// import 'codemirror/addon/hint/anyword-hint';
// import 'codemirror/addon/hint/javascript-hint';

const electron = window.require('electron').remote;
const electronLocalShortcut = window.require('electron-localshortcut');
const fs = window.require('fs');
const chokidar = window.require('chokidar');
const path = require('path');
const acorn = require("acorn-loose/dist/acorn-loose.js");

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
    } else if (node.type === "ExportNamedDeclaration") {
        if (node.declaration != null) {
            return functions.concat(astSearch(node.declaration));
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
        this.saveFileListener = this.saveFileListener.bind(this);
        this.getLanguageMode = this.getLanguageMode.bind(this);
        this.onCreateCommand = this.onCreateCommand.bind(this);
        this.codeMirror = null;
        
        // Add Ctrl-S and Cmd-S functionality
        electronLocalShortcut.register(electron.getCurrentWindow(), 'CmdOrCtrl+S', this.saveFileListener);
    }

    editorDidMount(editor) {
        this.addGutterCircles(editor);
        this.codeMirror = editor;

        this.watcher = chokidar.watch(database.commandsPath).on('all', (event, path) => {
            this.addGutterCircles(editor);
        });
    }

    editorDidUnmount() {
        this.watcher.close();
        electronLocalShortcut.unregister(electron.getCurrentWindow(), 'CmdOrCtrl+S', this.saveFileListener);
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

    readFile(file, callback) {
        fs.readFile(file, "utf8", (err, data) => {
            this.setState({
                lastSavedText: data,
                currentText: data
            });
            this.codeMirror.doc.clearHistory();
            this.props.setSelectFile(true);
            if (callback != null) callback();
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

    saveFileListener() {
        this.saveFile(this.state.file, true);
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

    getLanguageMode() {
        switch (this.state.file.split('.').pop()) {
            case 'xml':
                return 'xml';
            case 'html':
                return 'htmlmixed';
            case 'css':
                return 'css';
            default:
                return 'javascript';
        }
    }

    onCreateCommand() {
        this.readFile(this.state.file, () => {
            this.saveFile(this.state.file, true);
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
                        <AddCommandButton file={this.state.file} onCreateCommand={this.onCreateCommand}/>
                    </div>
                    <CodeMirror
                        value={this.state.lastSavedText}
                        options={{
                            theme: "base16-dark",
                            mode: this.getLanguageMode(),
                            lineNumbers: true,
                            gutters: ["commands"],
                            autoCloseBrackets: true
                        }}
                        editorDidMount={this.editorDidMount}
                        onChange={this.onChange}
                    />
                </div>
            );
        } else {
            return (
                <div className="noFileScreen">
                    <p style={{ textAlign: "center" }}>Select a file from the explorer</p>
                </div>
            );
        }
    }
}