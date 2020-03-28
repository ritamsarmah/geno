import React from 'react';
import Popover from './Popover';
import database from '../../../common/Database';
import './Popover.css';

import { ContextType } from '../../../common/constants';

const lodashId = require('lodash-id');

export default class UniversalPopover extends Popover {

    bindFunctions() {
        super.bindFunctions();
        this.createFunctionCommand = this.createFunctionCommand.bind(this);
        this.createDemoCommand = this.createDemoCommand.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        // FIXME: Closing popover and reopening doesn't update state correctly, so old data is still there
        if (this.props.command == null) {
            this.setState({ command: nextProps.command });
        }
        return true;
    }

    createFunctionCommand() {
        // TODO: create function command, navigate to editor file
        this.dismiss();
    }

    createDemoCommand() {
        // TODO: start recording demo command (switch to Preview?)
        this.dismiss();
    }

    changeCommandName(name) {
        this.setState(prevState => ({
            command: {
                ...prevState.command,
                name: name
            }
        }));
    }

    addQuery(text) {
        var query = database.getQueryPrototype(text);
        query.id = Math.floor(Math.random() * 1000000000); // dummy id 
        this.setState(prevState => ({
            command: {
                ...prevState.command,
                queries: [...prevState.command.queries, query]
            }
        }));
    }

    updateQuery(queryId, oldText, newText, callback) {
        var index = this.state.command.queries.findIndex(q => q.id === queryId);
        var query = this.state.command.queries[index];
        query.text = newText;
        var queries = this.state.command.queries;
        queries[index] = query;

        this.setState(prevState => ({
            command: {
                ...prevState.command,
                queries: queries
            }
        }), () => callback(query));
    }

    deleteQuery(query) {
        this.setState(prevState => ({
            command: {
                ...prevState.command,
                queries: prevState.command.queries.filter(q => q.id !== query.id)
            }
        }));
    }

    changeContextParameter(param) {
        this.setState(prevState => ({
            command: {
                ...prevState.command,
                contextInfo: {
                    ...prevState.command.contextInfo,
                    parameter: param
                }
            }
        }));
    }

    toggleContextAttribute(attribute) {
        var attributes = this.state.command.contextInfo.attributes;
        if (attributes.includes(attribute)) {
            attributes = attributes.filter(attr => attr !== attribute);
        } else {
            attributes.push(attribute);
        }

        var contextType = attribute.length === 0 ? ContextType.Element : ContextType.Attribute

        this.setState(prevState => ({
            command: {
                ...prevState.command,
                contextInfo: {
                    ...prevState.command.contextInfo,
                    type: contextType,
                    attributes: attributes
                }
            }
        }));
    }

    clearContextInfo() {
        this.setState(prevState => ({
            command: {
                ...prevState.command,
                contextInfo: {
                    ...prevState.command.contextInfo,
                    type: prevState.command.contextInfo.type === ContextType.Text ? ContextType.Text : ContextType.Element,
                    selector: "*",
                    allAttributes: [],
                    attributes: []
                }
            }
        }));
    }

    processContext(context) {
        this.setState(prevState => ({
            command: {
                ...prevState.command,
                contextInfo: {
                    ...prevState.command.contextInfo,
                    type: ContextType.Element,
                    selector: context.selector,
                    attributes: [],
                    allAttributes: context.attributes,
                    attributeExamples: context.attributeExamples
                }
            }
        })); 
    }

    renderButtons() {
        return (
            <div style={{ margin: "10px 0" }}>
                <div id="bottomButtons">
                    <input className="conditionalButton" type="button" value="Create Function" onClick={this.createFunctionCommand} disabled={this.isCommandValid()}></input>
                    <input className="conditionalButton" type="button" style={{ marginLeft: "8px" }} value="Create Demo" onClick={this.createDemoCommand} disabled={this.isCommandValid()}></input>
                </div>
            </div>
        );
    }

}
