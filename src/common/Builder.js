import { Paths } from "./constants";

import database from './Database';

const fs = window.require('fs');

class Builder {
    constructor() {
        this.dir = null;
    }

    configureProject(dir) {
        this.dir = dir;
    }

    build() {
        var queryMap = {}
        database.getCommands().forEach(cmd => {
            cmd.queries.forEach(q => {
                queryMap[q.query] = { file: cmd.file, triggerFn: cmd.triggerFn }
            });
        });

        // TODO: Optional code that shows the popover
        // TODO: Remove ...args since triggerFunction will parse arguments from speech
        // TODO: check if this is the right file with the function name (function might not exist and could cause error)

        // Add function to output function for a provided query
        var generatedCode = `
var funcForQuery = ${JSON.stringify(queryMap)}

function triggerFunction(query, ...args) {
    if (query in funcForQuery) {
        var f = funcForQuery[query];
        var func = window[f.triggerFn];
        var res = func(...args)
        console.log(res);
    }
}

function showGeno() {
    
}
        `

        fs.writeFileSync(this.dir + '/geno.js', generatedCode, 'utf8');
    }
}

var builder = new Builder();
export default builder;