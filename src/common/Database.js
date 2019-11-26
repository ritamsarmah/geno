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

    /* Config method to set user's project directory */
    configureProject(dir) {
        this.dir = dir;
        const commandsPath = this.dir + Paths.Commands;
        this.adapter = new FileSync(commandsPath);
        this.db = low(this.adapter);
        this.db._.mixin(lodashId)
    }

    /*** Command Functions ***/

    /* Get all commands */
    getCommands() {
        return this.db.get('commands').value();
    }

    /* Get command for file and triggerFn */
    findCommand(file, triggerFn) {
        return this.db.get('commands')
            .find({ file: file, triggerFn: triggerFn })
            .value();
    }

    /* Get command for ID */
    getCommandForId(id) {
        return this.db.get('commands')
            .getById(id)
            .value();
    }

    /* Add a command */
    addCommand(file, triggerFn, params) {
        var parameters = params.map((p) => {
            return { name: p, backupQuery: "" }
        });
        var cmd = {
            name: "untitled_command",
            file: file,
            triggerFn: triggerFn,
            parameters: parameters,
            queries: [],
            isTrained: false
        };

        this.db.get('commands').insert(cmd).write()
        return cmd;
    }

    updateCommand(id, data) {
        return this.db.get('commands').getById(id).assign(data).write();
    }

    removeCommand(id) {
        // TODO: Delete command from server
        return this.db.get('commands').removeById(id).write();
    }

    /*** Query Functions ***/
    
    getQueryForId(commandId, queryId) {
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value()
    }

    addQuery(commandId, query) {
        var data = {
            query: query,
            entities: []
        }
        this.db.get('commands').getById(commandId).get('queries').insert(data).write();
        // TODO perform entity analysis and execute some callback...
        return this.getCommandForId(commandId);
    }

    updateQuery(commandId, oldText, updatedQuery, callback) {
        // Perform entity analysis and execute callback
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/query/update');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        var thisDb = this
        xhr.onreadystatechange = () => {
            thisDb.db.get('commands').getById(commandId).get('queries').updateById(updatedQuery.id, updatedQuery).write();
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                // Only update if successful request
                var json = JSON.parse(this.responseText);
                updatedQuery.entities = json.entities
            }
            callback(thisDb.getCommandForId(commandId), thisDb.getQueryForId(commandId, updatedQuery.id));
        };

        xhr.send(JSON.stringify({
            "dev_id": 1,
            "intent": this.getCommandForId(commandId).name,
            "old_query": oldText,
            "new_query": updatedQuery.query
        }));
    }

    removeQuery(commandId, queryId) {
        this.db.get('commands').getById(commandId).get('queries').removeById(queryId).write();
        // TODO: Delete query from model
        return this.getCommandForId(commandId);
    }

    swapEntityNames(commandId, queryId, first, second) {
        var firstEntity = this.db.get('commands').getById(commandId).get('queries').getById(queryId).get('entities').find({ name: first });
        var secondEntity = this.db.get('commands').getById(commandId).get('queries').getById(queryId).get('entities').find({ name: second });
        firstEntity.assign({ name: second }).write();
        secondEntity.assign({ name: first }).write();
        // TODO: network request to model to tell it about changes
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    /*** Parameter Functions ***/
    
    updateParameters(commandId, params) {
        var command = this.db.get('commands').getById(commandId);
        var oldParams = command.get('parameters');
        var newParams = params.map(p => {
            var oldParam = oldParams.find({ name: p }).value()
            return oldParam ? oldParam : { name: p, backupQuery: "" }
        });
        command.assign({ parameters: newParams }).write();
    }

    updateBackupQuery(commandId, parameter, backupQuery) {
        this.db.get('commands').getById(commandId).get('parameters').find({ name: parameter }).assign({ backupQuery: backupQuery }).write();
        return this.getCommandForId(commandId);
    }

    trainModel(commandId, callback) {
        var command = this.getCommandForId(commandId)

        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/intent/train');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        var databaseThis = this;

        xhr.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    databaseThis.updateCommand(commandId, { "isTrained": true });
                }
                callback(this.response, this.status);
            }
        }

        var params = {
            "dev_id": 1,
            "intent": command.name,
            "queries": command.queries.map(q => q.query),
            "parameters": command.parameters.map(q => q.name)
        }

        xhr.send(JSON.stringify(params));
    }
}

var database = new Database();
export default database;