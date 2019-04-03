import React, { Component } from 'react';

export default class Preview extends Component {
    render() {
        return (
            <div style={{ height: "100vh" }}>
                <object type="text/html" data="http://validator.w3.org/">
                </object>
            </div>
        );
    }
}