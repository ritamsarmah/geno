import React, { Component } from 'react';

import { Colors } from '../../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faCode, faCircle } from '@fortawesome/free-solid-svg-icons';

export default class Preview extends Component {
    render() {
        return (
            <div>
                <embed src="http://validator.w3.org/" style={{ height: "94vh", width: "100%" }}></embed>
                <div style={{ height: "5vh", width: "100%", backgroundColor: Colors.Background, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <button><FontAwesomeIcon icon={faRedoAlt}></FontAwesomeIcon></button>
                    <button><FontAwesomeIcon icon={faCircle} color="red"></FontAwesomeIcon></button>
                    <button><FontAwesomeIcon icon={faCode}></FontAwesomeIcon></button>
                </div>
            </div>
        );
    }
}