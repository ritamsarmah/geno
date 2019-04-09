import React, { Component } from 'react';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './Popover.css'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

export default class Popover extends Component {

    constructor(props) {
        super(props);
        this.state = {
            queriesExpanded: false
        };
        this.toggleQueries = this.toggleQueries.bind(this);
        this.save = this.save.bind(this);
        this.showOptions = this.showOptions.bind(this);
    }

    toggleQueries() {
        this.setState({
            queriesExpanded: !this.state.queriesExpanded
        });
    }

    save() {
        // TODO
        console.log("Save");
    }

    showOptions() {
        // TODO
        console.log("Save");
    }

    render() {
        return (
            <div className="popover">
                <form className="popoverForm">
                    <p className="popoverTitle">Command Name</p>
                    <input type="text"></input>
                    
                    <p className="popoverTitle">Triggered Functions</p>
                    <input type="text" defaultValue={this.props.triggerFns.join(', ')}></input>

                    <p className="popoverTitle">Sample Queries</p>
                    <button className="smallButton">Record</button>
                    <button className="smallButton">Import</button>

                    {/* TODO: Make text area different when expanded for NLP analysis selection (Edit vs. NLP mode?) */}
                    <textarea id="queries" style={{ height: this.state.queriesExpanded ? "140px" : "60px", resize: this.state.queriesExpanded ? "vertical" : "none"}} defaultValue={this.props.params.join(', ')}></textarea>
                    <div id="queryToggle" onClick={this.toggleQueries}>
                        <FontAwesomeIcon icon={this.state.queriesExpanded ? faChevronUp : faChevronDown} />
                    </div>

                    <br></br>
                    <input type="button" value="Save" onClick={this.save}></input>
                    <input type="button" value="Options" onClick={this.showOptions}></input>
                </form>
            </div>
        );
    }
}
