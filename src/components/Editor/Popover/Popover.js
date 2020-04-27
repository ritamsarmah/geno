import React, { Component } from 'react';
import AnalysisView from '../AnalysisView/AnalysisView';
import Tippy from '@tippy.js/react';
import emitter from '../../../common/Emitter';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faQuestionCircle, faCrosshairs, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { Colors, ContextType, HelpText, GenoEvent } from '../../../common/constants';

import './Popover.css'
import 'tippy.js/themes/light-border.css';


export default class Popover extends Component {

    constructor(props) {
        super(props);

        this.state = {
            command: this.props.command,
            renderAnalysis: false,
            flipSide: false,
            selectedQuery: null,
            isTrackingContext: false,
        };

        this.analysisUpdatesDatabase = true;
        this.bindFunctions();
    }

    bindFunctions() {
        this.dismiss = this.dismiss.bind(this);
        this.showAnalysis = this.showAnalysis.bind(this);
        this.handleAnalysisUnmount = this.handleAnalysisUnmount.bind(this);
        this.deleteCommand = this.deleteCommand.bind(this);
        this.changeCommandName = this.changeCommandName.bind(this);
        this.addQuery = this.addQuery.bind(this);
        this.onAddQuery = this.onAddQuery.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.deleteQuery = this.deleteQuery.bind(this);
        this.changeBackupQuery = this.changeBackupQuery.bind(this);
        this.changeContextParameter = this.changeContextParameter.bind(this);
        this.onChangeContextParameter = this.onChangeContextParameter.bind(this);
        this.toggleContextAttribute = this.toggleContextAttribute.bind(this);
        this.onToggleContextAttribute = this.onToggleContextAttribute.bind(this);
        this.clearContextInfo = this.clearContextInfo.bind(this);
        this.toggleTrackingContext = this.toggleTrackingContext.bind(this);
        this.stopTrackingContext = this.stopTrackingContext.bind(this);
        this.processContext = this.processContext.bind(this);
    }

    /* Dismisses this component */
    dismiss() {
        emitter.emit(GenoEvent.StopTrackContext);
        this.props.unmountMe();
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
        this.setState({ renderAnalysis: false });
    }

    /* Function for changing command name */
    changeCommandName(name) { }

    /* Function for delete command button */
    deleteCommand() {
        this.dismiss();
    }

    /* Function for adding a query */
    addQuery(text) { }

    /* Button event handler for adding a query */
    onAddQuery() {
        var queryInput = document.getElementById('addQueryInput');
        if (queryInput.value !== "") {
            this.addQuery(queryInput.value);
            queryInput.value = "";
        }
    }

    /* Function for updating query (called from AnalysisView) */
    updateQuery(queryId, oldText, newText, callback) { }

    /* Function for deleting query */
    deleteQuery(query) { }

    /* Function for changing backup query */
    changeBackupQuery(event, paramName) { }

    /* Function for changing context parameter */
    changeContextParameter(param) { }

    /* Dropdown event handler for adding a query */
    onChangeContextParameter(event) {
        var param = event.target.value === '-' ? null : event.target.value;
        if (param == null && this.state.isTrackingContext) {
            this.toggleTrackingContext();
        }
        this.changeContextParameter(param);
    }

    /* Function for changing context attribute */
    toggleContextAttribute(attribute) { }

    /* Checkbox event handler for changing context attribute */
    onToggleContextAttribute(event) {
        var attribute = event.target.name;
        this.toggleContextAttribute(attribute);
    }

    /* Function for clearing context information */
    clearContextInfo() { }

    /* Toggle tracking context in Preview */
    toggleTrackingContext() {
        this.setState((state, _props) => ({ isTrackingContext: !state.isTrackingContext }), () => {
            if (this.state.isTrackingContext) {
                emitter.on(GenoEvent.ShareContext, this.processContext);
                emitter.on(GenoEvent.StopTrackContext, this.stopTrackingContext);
                emitter.emit(GenoEvent.TrackContext);
                document.body.style.setProperty('cursor', 'crosshair', 'important');
            } else {
                emitter.emit(GenoEvent.StopTrackContext);
            }
        });
    }

    /* Stop tracking context */
    stopTrackingContext() {
        emitter.removeListener(GenoEvent.ShareContext, this.processContext);
        emitter.removeListener(GenoEvent.StopTrackContext, this.stopTrackingContext);
        document.body.style.setProperty('cursor', 'inherit');
        this.setState({
            renderAnalysis: false,
            isTrackingContext: false
        })
    }

    /* Processes received context elements and displays to user */
    processContext(context) { }

    /* Returns if command context info is default selector */
    isContextDefault() {
        return this.state.command.contextInfo.selector === "*";
    }

    /* Checks that basic conditions for valid command are kept */
    isCommandValid() {
        return this.state.command.name === "" || this.state.command.queries.length < 2;
    }

    /* UI Rendering Functions */

    // NOTE: Unused
    renderSummary() { return null; }

    renderButtons() { return null; }

    renderContextDescription() {
        var description = "";

        if (this.state.command.contextInfo.parameter == null) {
            return null;
        } else {
            switch (this.state.command.contextInfo.type) {
                case ContextType.Element:
                    if (this.isContextDefault()) {
                        description = "Pass any HTML element for parameter";
                    } else {
                        description = "Pass HTML element if it matches selector";
                    }
                    break;
                case ContextType.Attribute:
                    if (this.state.command.contextInfo.attributes.length == 1) {
                        description = "Pass a single attribute for element";
                    } else {
                        description = "Pass an array of attributes for element";
                    }
                    break;
            }
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

    renderContextDropdown() {
        var names = this.state.command.parameters.map(p => p.name);
        names.unshift("-");

        var selection = this.state.command.contextInfo.parameter != null ? this.state.command.contextInfo.parameter : "-";

        return (
            <select defaultValue={selection} onChange={this.onChangeContextParameter} style={{ width: "86%" }}>
                {names.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        );
    }

    renderTooltip(text) {
        return (
            <Tippy content={<div style={{ whiteSpace: "pre-wrap" }}>{text}</div>} placement="right" maxWidth="400px" animateFill={false}>
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
                                onChange={this.onToggleContextAttribute}>
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

        return (
            <div>
                <div className="popover">
                    <form className="popoverForm">
                        {/* Command Name */}
                        <p className="popoverTitle">Intent Name</p>
                        <input id="commandNameInput" type="text" defaultValue={this.state.command.name} onChange={(e) => this.changeCommandName(e.target.value.replace(/ /g, "_"))}></input>

                        {/* Example Utterances */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <p className="popoverTitle">Example Utterances</p>
                            {this.renderTooltip(HelpText.ExampleQueries)}
                        </div>
                        <div>
                            <div>
                                <input id="addQueryInput" type="text" placeholder="Add example utterance" onKeyUp={e => { if (e.key == "Enter") this.onAddQuery(); }}></input>
                                <span className="iconButton" onClick={this.onAddQuery}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </span>
                            </div>

                            <div className="listView">
                                {this.state.command.queries.map(q => <div key={q.id} className="listItem" onClick={() => this.showAnalysis(q)}>{q.text}</div>)}
                            </div>
                        </div>

                        <br></br>

                        {/* Multimodal Context */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <p className="popoverTitle">Multimodal GUI Context</p>
                            {this.renderTooltip(HelpText.Multimodal)}
                        </div>
                        <div>
                            <div>
                                {this.renderContextDropdown()}
                                <span className="iconButton"
                                    onClick={this.toggleTrackingContext}
                                    style={{
                                        cursor: crossHairCursor,
                                        pointerEvents: this.state.command.contextInfo.parameter == null ? "none" : "auto"
                                    }}>
                                    <FontAwesomeIcon
                                        icon={faCrosshairs}
                                        style={{ color: crossHairColor }} />
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
                                    trigger={this.isContextDefault() ? "" : "click"}
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
                            {this.renderButtons()}
                        </div>
                    </form>
                </div>
                {this.state.renderAnalysis
                    ? <AnalysisView
                        command={this.state.command}
                        query={this.state.selectedQuery}
                        updateQuery={this.updateQuery}
                        deleteQuery={this.deleteQuery}
                        flipSide={this.state.flipSide}
                        unmountMe={this.handleAnalysisUnmount}
                        updatesDatabase={this.analysisUpdatesDatabase} />
                    : null}
            </div>
        );
    }
}
