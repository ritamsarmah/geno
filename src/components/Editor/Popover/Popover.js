import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';
import Tippy from '@tippy.js/react';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus, faQuestionCircle, faCrosshairs, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { Colors, ContextType, HelpText, GenoEvent } from '../../../common/constants';

import './Popover.css'
import 'tippy.js/themes/light-border.css';

import database from '../../../common/Database';
import emitter from '../../../common/Emitter';

export default class Popover extends Component {

    POPOVER_MAIN = 0;
    POPOVER_OPTIONS = 1;
    POPOVER_CONTEXT = 2;

    constructor(props) {
        super(props);
        this.state = {
            queriesExpanded: false,
            contextExpanded: false,
            renderAnalysis: false,
            selectedQuery: null,
            command: this.props.command,
            popoverState: this.POPOVER_MAIN,
            flipSide: false,
            isTrackingContext: false,
            buttonValue: "Train Model"
        };

        this.dismiss = this.dismiss.bind(this);
        this.toggleQueries = this.toggleQueries.bind(this);
        this.toggleContext = this.toggleContext.bind(this);
        this.showMain = this.showMain.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.showContext = this.showContext.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);

        this.deleteCommand = this.deleteCommand.bind(this);
        this.changeCommandName = this.changeCommandName.bind(this);
        this.addQuery = this.addQuery.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.deleteQuery = this.deleteQuery.bind(this);
        this.changeBackupQuery = this.changeBackupQuery.bind(this);
        this.changeContextParameter = this.changeContextParameter.bind(this);
        this.changeContextAttribute = this.changeContextAttribute.bind(this);
        this.clearContextInfo = this.clearContextInfo.bind(this);
        this.toggleTrackingContext = this.toggleTrackingContext.bind(this);
        this.processContext = this.processContext.bind(this);
        this.isContextDefault = this.isContextDefault.bind(this);
        this.trainModel = this.trainModel.bind(this);
        this.renderAttributeSelect = this.renderAttributeSelect.bind(this);
    }

    /* Dismisses this component */
    dismiss() {
        this.props.unmountMe();
    }

    /* Toggle resizing of sample queries list */
    toggleQueries() {
        this.setState({ queriesExpanded: !this.state.queriesExpanded });
    }

    /* Toggle resizing of context list */
    toggleContext() {
        this.setState({ contextExpanded: !this.state.contextExpanded });
    }

    /* Switch to main form */
    showMain() {
        this.setState({
            popoverState: this.POPOVER_MAIN
        });
    }

    /* Switch to advanced options */
    showOptions() {
        this.setState({
            renderAnalysis: false,
            popoverState: this.POPOVER_OPTIONS
        })
    }

    /* Switch to context options */
    showContext() {
        this.setState({
            renderAnalysis: false,
            popoverState: this.POPOVER_CONTEXT
        })
    }

    /* Shows AnalysisView for editing a selected query */
    showAnalysis(query) {
        this.setState({
            renderAnalysis: true,
            selectedQuery: query
        });
    }

    /* Handles unmount of AnalysisView */
    handleAnalysisUnmount() {
        this.setState({
            renderAnalysis: false,
        });
    }

    /* Updates command name in database */
    changeCommandName(event) {
        database.updateCommand(this.state.command.id, {
            name: event.target.value.replace(/ /g, "_")
        });
    }

    /* Deletes command from database */
    deleteCommand() {
        database.removeCommand(this.state.command.id);
        this.dismiss();
    }

    /* Adds query for command to database */
    addQuery() {
        var queryInput = document.getElementById('addQueryInput');
        if (queryInput.value !== "") {
            this.setState({
                command: database.addQuery(this.state.command.id, queryInput.value)
            }, () => queryInput.value = "");
        }
    }

    /* Update query for command in database */
    updateQuery(oldText, query, callback) {
        database.updateQuery(this.state.command.id, oldText, query, (command, updatedQuery) => {
            // Don't want to trigger setState updates
            // eslint-disable-next-line
            this.state.command = command;
            callback(updatedQuery);
        });
    }

    /* Deletes query for command from database */
    deleteQuery(query) {
        this.setState({
            command: database.removeQuery(this.state.command.id, query.id)
        });
    }

    /* Change value for backup query */
    changeBackupQuery(event, paramName) {
        this.setState({
            command: database.updateBackupQuery(this.state.command.id, paramName, event.target.value)
        });
    }

    /* Change value for which parameter inferred from element under mouse */
    changeContextParameter(event) {
        var param = event.target.value === '-' ? null : event.target.value;
        this.setState({
            command: database.updateContextParameter(this.state.command.id, param)
        });
    }

    /* Change element attribute(s) to return as a parameter for multimodal input */
    changeContextAttribute(event) {
        var attribute = event.target.name;
        this.setState({
            command: database.toggleContextAttribute(this.state.command.id, attribute)
        });
    }

    /* Reset context information */
    clearContextInfo() {
        this.setState({
            command: database.clearContextInfo(this.state.command.id)
        });
    }

    /* Toggle tracking context in Preview */
    toggleTrackingContext() {
        this.setState({ isTrackingContext: !this.state.isTrackingContext }, () => {
            if (this.state.isTrackingContext) {
                emitter.on(GenoEvent.ShareContext, this.processContext);
                emitter.emit(GenoEvent.TrackContext);
                document.body.style.setProperty('cursor', 'crosshair', 'important');
            } else {
                emitter.emit(GenoEvent.StopTrackContext);
                emitter.removeListener(GenoEvent.ShareContext, this.processContext);
                document.body.style.setProperty('cursor', 'inherit');
            }
        });
    }

    /* Processes received context elements and displays to user */
    processContext(context) {
        this.setState({
            command: database.updateCommandContext(this.state.command.id, {
                selector: context.selector,
                type: ContextType.Element,
                attributes: [], // reset attributes if we are changing selector, since old attribute a
                allAttributes: context.attributes,
                attributeExamples: context.attributeExamples
            })
        });
    }

    /* Returns if command context info is default selector */
    isContextDefault() {
        return this.state.command.contextInfo.selector === "*";
    }

    trainModel(e) {
        var button = e.target
        button.value = "Training..."
        database.trainModel(this.state.command.id, (error) => {
            this.setState({ buttonValue: `Train Model (${error ? "Failed" : "Success"})` });
            if (error) {
                window.alert(error);
            }
        });
    }

    /* UI Rendering Functions */
    
    renderContextDescription() {
        var description = "";
        switch (this.state.command.contextInfo.type) {
            case ContextType.Element:
                description = "Parameter value will be an HTML element";
                break;
            case ContextType.Attribute:
                if (this.state.command.contextInfo.attributes.length == 1) {
                    description = "Parameter value will be a single attribute";
                } else {
                    description = "Parameter value will be an array of attributes";
                }
                break;
        }

        return (
            <p className="popoverSubtitle"
                tabIndex="0"
                style={{
                    marginTop: "7px",
                    fontSize: "11px",
                    display: "inline-block"
                }}>
                {description}
            </p>
        );
    }

    renderSummary() {
        return (
            <div>
                <p className="popoverTitle">Triggered Function</p>
                <div className="popoverFn">{this.state.command.triggerFn}</div>
            </div>
        );
    }

    renderContextDropdown() {
        var names = this.state.command.parameters.map(p => p.name);
        names.unshift("-");

        var selection = this.state.command.contextInfo.parameter != null ? this.state.command.contextInfo.parameter : "-";

        return (
            <select defaultValue={selection} onChange={this.changeContextParameter} style={{ width: "86%" }}>
                {names.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        );
    }

    renderTooltip(text) {
        return (
            <Tippy content={<div style={{ whiteSpace: "pre-wrap" }}>{text}</div>} placement="right" maxWidth="300px" animateFill={false}>
                <span tabIndex="0">
                    <FontAwesomeIcon icon={faQuestionCircle}></FontAwesomeIcon>
                </span>
            </Tippy>
        );
    }

    renderAttributeSelect() {
        if (this.state.command.contextInfo.allAttributes.length == 0) {
            return (
                <div className="attributeBox">
                    No attributes available
                </div>
            );
        } else {
            return (
                <div className="attributeBox">
                    {this.state.command.contextInfo.allAttributes.map(attr =>
                        <div key={`context-${attr}`}>
                            <input type="checkbox" name={attr}
                                defaultChecked={this.state.command.contextInfo.attributes.includes(attr)}
                                onChange={this.changeContextAttribute}>
                            </input>
                            <label>{`${attr} (${this.state.command.contextInfo.attributeExamples[attr]})`}</label>
                            <br></br>
                        </div>
                    )}
                </div>
            )
        }
    }

    render() {
        // Determine color and cursor for crosshairs
        var crossHairColor = "lightgray";
        if (this.state.command.contextInfo.parameter != null) {
            crossHairColor = this.state.isTrackingContext ? Colors.Theme : "black";
        }
        var crossHairCursor = this.state.command.contextInfo.parameter != null ? "pointer" : "default";

        switch (this.state.popoverState) {
            case this.POPOVER_MAIN:
                return (
                    <div>
                        <div className="popover">
                            <form className="popoverForm">
                                {/* Command Name */}
                                <p className="popoverTitle">Command Name</p>
                                <input id="commandNameInput" type="text" defaultValue={this.state.command.name} onChange={this.changeCommandName}></input>

                                {/* Summary */}
                                {this.renderSummary()}
                                <br></br>
                                <br></br>

                                {/* Example Queries */}
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <p className="popoverTitle">Example Queries</p>
                                    {this.renderTooltip(HelpText.ExampleQueries)}
                                </div>
                                <div>
                                    <div>
                                        <input id="addQueryInput" type="text" placeholder="Add example query"></input>
                                        <span className="iconButton" onClick={this.addQuery}>
                                            <FontAwesomeIcon icon={faPlus} />
                                        </span>
                                    </div>

                                    <div className="listView" style={{
                                        minHeight: "52px",
                                        height: this.state.queriesExpanded ? "140px" : "52px",
                                        resize: this.state.queriesExpanded ? "vertical" : "none"
                                    }}>
                                        {this.state.command.queries.map(q => <div key={q.id} className="listItem" onClick={() => this.showAnalysis(q)}>{q.text}</div>)}
                                    </div>

                                    <div className="listToggle" onClick={this.toggleQueries}>
                                        <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                                    </div>
                                </div>

                                {/* Multimodal Context */}
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <p className="popoverTitle">Multimodal Context</p>
                                    {this.renderTooltip(HelpText.Multimodal)}
                                </div>
                                <div>
                                    <div>
                                        {this.renderContextDropdown()}
                                        <span className="iconButton"
                                            onClick={this.toggleTrackingContext}
                                            style={{ cursor: crossHairCursor }}>
                                            <FontAwesomeIcon
                                                icon={faCrosshairs}
                                                style={{ color: crossHairColor }}
                                                disabled={true} />
                                        </span>
                                    </div>

                                    {/* Context Selector Text */}
                                    <div className="contextSelectText" style={{
                                        display: (this.state.command.contextInfo.parameter == null || this.isContextDefault()) ? "none" : "flex",
                                    }}>
                                        <Tippy content={this.renderAttributeSelect()}
                                            appendTo='parent'
                                            interactive={true}
                                            theme="light-border"
                                            placement="right"
                                            trigger={this.isContextDefault() ? "" : "mouseenter"}
                                            animateFill={false}
                                            maxWidth="none">
                                            <span className={"contextItem " + (this.isContextDefault() ? "" : "customContext")}
                                                style={{
                                                    display: this.isContextDefault() ? "none" : "inline-block",
                                                    maxWidth: "85%"
                                                }}
                                                tabIndex="0">
                                                {this.state.command.contextInfo.selector}
                                            </span>
                                        </Tippy>

                                        <span onClick={this.clearContextInfo}>
                                            <FontAwesomeIcon icon={faTimesCircle}
                                                style={{
                                                    display: this.isContextDefault() ? "none" : "inline-block",
                                                    margin: "-2px auto",
                                                    paddingRight: "6px",
                                                    cursor: "pointer"
                                                }} />
                                        </span>
                                    </div>
                                    {this.renderContextDescription()}

                                    <input type="button" style={{ margin: "10px 0" }} value={this.state.buttonValue} onClick={this.trainModel}></input>
                                    <br></br>
                                    <div id="bottomButtons">
                                        <input type="button" value="Options" onClick={this.showOptions}></input>
                                        <input type="button" style={{ marginLeft: "8px", color: "red" }} value="Delete" onClick={this.deleteCommand}></input>
                                    </div>
                                </div>
                            </form>
                        </div>
                        {this.state.renderAnalysis ? <AnalysisView command={this.state.command} query={this.state.selectedQuery} updateQuery={this.updateQuery} deleteQuery={this.deleteQuery} flipSide={this.state.flipSide} unmountMe={this.handleAnalysisUnmount} /> : null}
                    </div>
                );
            case this.POPOVER_OPTIONS:
                return (
                    <div>
                        <div className="popover">
                            <form className="popoverForm">
                                <p className="popoverTitle">Parameters</p>
                                <p className="popoverSubtitle">Add follow up questions to ask when a parameter is not provided by user.</p>
                                {this.state.command.parameters.map(p => {
                                    return (
                                        <div key={p.name}>
                                            <p className="paramTitle">{p.name}</p>
                                            <input type="text" defaultValue={p.backupQuery} placeholder="Follow up question" onChange={(event) => this.changeBackupQuery(event, p.name)}></input>
                                        </div>
                                    )
                                })}
                                <input type="button" value="Done" onClick={this.showMain}></input>
                            </form>
                        </div>
                    </div>
                );
            default:
                break;
        }
    }
}
