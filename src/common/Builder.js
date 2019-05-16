import { Paths } from "./constants";

import database from './Database';

const electron = window.require('electron');
const app = electron.remote.app;
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
        var generatedCode = `\n\nvar funcForQuery = ${JSON.stringify(queryMap)}`;
        var jsSource = `${app.getAppPath()}/src/common/exported/geno.js`;
        var jsDest = this.dir + '/geno/geno.js';

        var cssSource = `${app.getAppPath()}/src/common/exported/geno.css`;
        var cssDest = this.dir + '/geno/geno.css';

        fs.mkdir(this.dir + '/geno', (err) => {
            fs.copyFile(jsSource, jsDest, (err) => {
                fs.appendFileSync(jsDest, generatedCode);
            });
            fs.copyFile(cssSource, cssDest, (err) => {
            });
        });
        
    }
}

var builder = new Builder();
export default builder;