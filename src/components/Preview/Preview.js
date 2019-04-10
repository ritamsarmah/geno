import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt, faCircle, faCog } from '@fortawesome/free-solid-svg-icons';

import './Preview.css'

export default class Preview extends Component {
    render() {
        return (
            <div>
                <iframe className="preview" src="https://www.webpagetest.org"></iframe>
                <div className="buttons centered">
                    <div>
                        <button className="previewBtn"><FontAwesomeIcon icon={faRedoAlt} size="lg"></FontAwesomeIcon></button>
                        <button className="previewBtn"><FontAwesomeIcon icon={faCog} size="lg"></FontAwesomeIcon></button>
                </div>
                    <div>

                        <button className="previewBtn"><FontAwesomeIcon icon={faCircle} color="red" size="lg"></FontAwesomeIcon></button>
                    </div>
                </div>
            </div>
        );
    }
}