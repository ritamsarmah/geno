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
        var commandMap = {}
        database.getCommands().forEach(cmd => {
            // Only copy over commands that have been trained
            if (cmd.isTrained) {
                if (cmd.type === "demo") {
                    commandMap[cmd.name] = {
                        type: cmd.type,
                        elements: cmd.elements,
                        delay: cmd.delay
                    };
                } else if (cmd.type === "function") {
                    var parameterMap = {}

                    cmd.parameters.forEach(p => {
                        parameterMap[p.name] = p.backupQuery
                    });
                    commandMap[cmd.name] = {
                        type: cmd.type,
                        file: cmd.file,
                        triggerFn: cmd.triggerFn,
                        parameters: parameterMap // TODO: later include info on what to convert data type to
                    };
                }
            }
        });

        // TODO: Optional code that shows the popover
        // TODO: check if this is the right file with the function name (function might not exist and could cause error)

        // Add function to output function for a provided query
        var generatedCode = `\n\ngeno.intentMap = ${JSON.stringify(commandMap)}`;
        var jsSource = `${app.getAppPath()}/src/common/exported/geno.js`;
        var jsDest = this.dir + '/geno/geno.js';

        var cssSource = `${app.getAppPath()}/src/common/exported/geno.css`;
        var cssDest = this.dir + '/geno/geno.css';

        // Copy over backup sample queries

        fs.mkdir(this.dir + '/geno', (err) => {
            fs.copyFile(jsSource, jsDest, (err) => {
                fs.appendFileSync(jsDest, generatedCode);
            });
            fs.copyFile(jsSource, jsDest, (err) => {});
            fs.copyFile(cssSource, cssDest, (err) => {});
        });
        
    }
}

var builder = new Builder();
export default builder;