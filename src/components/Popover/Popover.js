import React, { Component } from 'react';

export default class Popover extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{ width:"200px" }}>
                <form>
                    Command Name <br></br>
                    <input type="text"></input>
                    <br></br>
                    
                    Triggered Functions <br></br>
                    <input type="text"></input>

                    <br></br>

                    Sample Queries <br></br>
                    <input type="text"></input>
                    <br></br>

                    <input type="submit" value="Submit"></input>
                    <input type="button" value="Options"></input>
                </form>
            </div>
        );
    }
}
