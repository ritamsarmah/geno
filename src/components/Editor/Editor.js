import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Marker from './Marker/Marker';

import { UnControlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';
import './Editor.css';

import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';

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
        // this.state = {
        //     markers: {} // TODO: Load this from some JSON file that we create
        // }
        this.editorDidMount = this.editorDidMount.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    editorDidMount(editor) {
        this.addGutterCircles(editor);
    }

    onChange(editor, data, value) {
        this.addGutterCircles(editor);
    }

    // Redraw all circles for lines with function declarations
    addGutterCircles(editor) {
        editor.doc.clearGutter("commands");

        extractFunctions(editor.getValue()).forEach(f => {
            var anchor = makeAnchor();
            editor.doc.setGutterMarker(f.lineNumber - 1, "commands", anchor);

            var marker = <Marker triggerFns={[f.name]} params={f.params} />;
            ReactDOM.render(marker, anchor);
        });
    }

    render() {
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