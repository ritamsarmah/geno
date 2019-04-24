import { Paths } from "./constants";

const lodashId = require('lodash-id')
const low = require('lowdb');
const FileSync = window.require('lowdb/adapters/FileSync');

class Database {

    constructor() {
        this.dir = null;
        this.adapter = null;
        this.db = null;

        this.configureProject = this.configureProject.bind(this);
        this.addQuery = this.addQuery.bind(this);
    }

    configureProject(dir) {
        this.dir = dir;
        const commandsPath = this.dir + Paths.Commands;
        this.adapter = new FileSync(commandsPath);
        this.db = low(this.adapter);
        this.db._.mixin(lodashId)
    }

    /* Commands */
    getCommands() {
        return this.db.get('commands').value();
    }

    findCommand(file, triggerFn) {
        return this.db.get('commands')
            .find({ file: file, triggerFn: triggerFn })
            .value();
    }

    findCommandForId(id) {
        return this.db.get('commands')
            .getById(id)
            .value();
    }

    addCommand(file, triggerFn, params) {
        var parameters = params.map((p) => {
            return { name: p, backupQuery: "" }
        });
        var cmd = {
            name: "Untitled Command",
            file: file,
            triggerFn: triggerFn,
            parameters: parameters,
            queries: []
        };

        this.db.get('commands').insert(cmd).write()
        return cmd;
    }

    updateCommand(id, data) {
        return this.db.get('commands').getById(id).assign(data).write();
    }

    removeCommand(id) {
        return this.db.get('commands').removeById(id).write();
    }

    /* Queries */
    addQuery(commandId, query) {
        var data = {
            query: query,
            userCustom: false,
            entities: []
        }
        this.db.get('commands').getById(commandId).get('queries').insert(data).write();
        return this.db.get('commands').getById(commandId).value();
    }

    removeQuery(commandId, queryId) {
        this.db.get('commands').getById(commandId).get('queries').removeById(queryId).write();
        return this.db.get('commands').getById(commandId).value();
    }
}

var database = new Database();
export default database;