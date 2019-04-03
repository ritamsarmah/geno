import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faCode, faCircle } from '@fortawesome/free-solid-svg-icons';

import './Preview.css'

export default class Preview extends Component {
    render() {
        return (
            <div>
                <embed src="http://validator.w3.org/" style={{ height: "94vh", width: "100%" }}></embed>
                <div className="buttons centered">
                    <button><FontAwesomeIcon icon={faRedoAlt}></FontAwesomeIcon></button>
                    <button><FontAwesomeIcon icon={faCircle} color="red"></FontAwesomeIcon></button>
                    <button><FontAwesomeIcon icon={faCode}></FontAwesomeIcon></button>
                </div>
            </div>
        );
    }
}