import database from './Database';

const electron = window.require('electron');
const app = electron.remote.app;
const fs = window.require('fs');

class Builder {
    constructor() {
        this.dir = null;
    }

    /* Config method to set user's project directory */
    configureProject(dir) {
        this.dir = dir;
    }

    /* Copies over files and database info into developer's project */ 
    build() {
        var commandMap = {}
        database.getCommands().forEach(cmd => {
            // Only copy over commands that have been trained
            if (cmd.isTrained) {
                if (cmd.type === "demo") {
                    commandMap[cmd.name] = {
                        type: cmd.type,
                        elements: cmd.elements,
                        parameters: cmd.parameters,
                        delay: cmd.delay,
                        contextInfo: cmd.contextInfo
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
                        parameters: parameterMap,
                        contextInfo: cmd.contextInfo
                    };
                }
            }
        });

        // Add function to output function for a provided query
        var generatedCode = `\n\ngeno.commands = ${JSON.stringify(commandMap)}`;
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