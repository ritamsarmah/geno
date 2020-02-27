import { Paths } from "./constants";
import preferences from './Preferences';

const lodashId = require('lodash-id')
const low = require('lowdb');
const FileSync = window.require('lowdb/adapters/FileSync');

class Database {

    constructor() {
        this.dir = null;
        this.adapter = null;
        this.db = null;

        this.configureProject = this.configureProject.bind(this);
    }

    /* Config method to set user's project directory */
    configureProject(dir) {
        this.dir = dir;
        this.commandsPath = this.dir + Paths.Commands;
        this.adapter = new FileSync(this.commandsPath);
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
            name: "untitled_command" + (this.getCommands().length + 1),
            file: file,
            triggerFn: triggerFn,
            parameters: parameters,
            queries: [],
            isTrained: false,
            mouseParameter: null,
            mouseAttribute: "",
            type: "function"
        };

        this.db.get('commands').insert(cmd).write()
        return cmd;
    }

    /* Add a command for programming by demo */
    addDemoCommand(elements, params, file) {
        var index = 0;
        var parameters = params.map((p) => {
            index += 1;
            return { name: "param" + index, index: p, backupQuery: "" }
        });
        var cmd = {
            name: "untitled_command" + (this.getCommands().length + 1),
            elements: elements,
            file: file,
            parameters: parameters,
            delay: 0,
            queries: [],
            isTrained: false,
            type: "demo"
        };

        this.db.get('commands').insert(cmd).write()
        return cmd;
    }

    /* Update a command */
    updateCommand(id, data) {
        return this.db.get('commands').getById(id).assign(data).write();
    }

    /* Remove a command */
    removeCommand(id) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/intent/delete');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.send(JSON.stringify({
            "dev_id": preferences.getDevId(),
            "intent": this.getCommandForId(id).name,
        }));

        return this.db.get('commands').removeById(id).write();
    }

    /*** Query Functions ***/

    /* Get query for ID */
    getQueryForId(commandId, queryId) {
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    /* Add a query to a command */
    addQuery(commandId, queryText) {
        var words = queryText.split(" ");
        var entities = {};

        // Map start index of entity in queryText to entity info
        var index = 0;
        words.forEach(word => {
            entities[index] = {
                label: null,
                text: word,
                start: index,
                end: index + word.length
            };
            index += word.length + 1;
        });

        var data = {
            text: queryText,
            entities: entities
        };
        this.db.get('commands').getById(commandId).get('queries').insert(data).write();
        return this.getCommandForId(commandId);
    }

    /* Make changes to a query and train model */
    updateQuery(commandId, oldText, updatedQuery, callback) {
        // Perform entity analysis and execute callback
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/query/update');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                // TODO: There's a bug here
                this.db.get('commands').getById(commandId).get('queries')
                    .updateById(updatedQuery.id, updatedQuery).write();

                callback(this.getCommandForId(commandId), this.getQueryForId(commandId, updatedQuery.id));
            }
        };

        var command = this.getCommandForId(commandId);
        var parameters = Object.values(updatedQuery.entities).filter(en => en.label)

        xhr.send(JSON.stringify({
            "dev_id": preferences.getDevId(),
            "intent": command.name,
            "parameters": parameters,
            "old_query": oldText,
            "new_query": updatedQuery.text
        }));
    }

    /* Delete a query and train model */
    removeQuery(commandId, queryId) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/query/delete');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.send(JSON.stringify({
            "dev_id": preferences.getDevId(),
            "intent": this.getCommandForId(commandId).name,
            "query": this.getQueryForId(commandId, queryId).text
        }));

        this.db.get('commands').getById(commandId).get('queries').removeById(queryId).write();
        return this.getCommandForId(commandId);
    }

    /* Update label for entity */
    updateEntity(commandId, queryId, entity, label) {
        this.db.get('commands').getById(commandId)
            .get('queries').getById(queryId)
            .get('entities')
            .get(entity.start)
            .assign({ label: label }).write();

        // NOTE: We don't inform backend until developer manually trains model
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    /* Parse data from backend and convert it into representation for our database */
    parseEntityResponse(commandId, entities) {
        entities.forEach(ex => {
            if ('entities' in ex) {
                var query = this.db.get('commands').getById(commandId)
                    .get('queries').find({ text: ex.text }) // FIXME: Match using queryId, instead of text (will need to send queryId to backend)
                    .get('entities');

                ex.entities.forEach(en => {
                    var index = en.start;
                    // Split multi-word entities for our database
                    en.text.split(" ").forEach(word => {
                        query.get(index).assign({
                            "label": en.entity
                        }).write();
                        index += word.length + 1;
                    });
                });
            }
        });
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

    /* Change name for a parameter */
    updateParameterName(commandId, oldName, newName) {
        this.db.get('commands').getById(commandId).get('parameters').find({ name: oldName }).assign({ name: newName }).write();
        return this.getCommandForId(commandId);
    }

    /* Change backup query to ask if a parameter entity is not detected in user's voice input */
    updateBackupQuery(commandId, parameter, backupQuery) {
        this.db.get('commands').getById(commandId).get('parameters').find({ name: parameter }).assign({ backupQuery: backupQuery }).write();
        return this.getCommandForId(commandId);
    }

    /* Change entity to map multimodal input to */
    updateMouseParameter(commandId, parameter) {
        this.updateCommand(commandId, { mouseParameter: parameter });
        return this.getCommandForId(commandId);
    }

    /* Change element attribute to read as a parameter for multimodal input */
    updateMouseAttribute(commandId, attribute) {
        this.updateCommand(commandId, { mouseAttribute: attribute });
        return this.getCommandForId(commandId);
    }

    /*** Demo Command Functions ***/
    
    updateDelay(commandId, delay) {
        this.db.get('commands').getById(commandId).assign({ delay: delay }).write();
        return this.getCommandForId(commandId);
    } 

    /*** Training ***/
    
    trainModel(commandId, callback) {
        var command = this.getCommandForId(commandId)

        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/intent/train');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        var thisDb = this;

        xhr.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    thisDb.updateCommand(commandId, { "isTrained": true });
                    // Add entity information for command
                    var json = JSON.parse(this.responseText);
                    thisDb.parseEntityResponse(commandId,
                        json['rasa_nlu_data']['common_examples'].filter(ex => ex.intent === command.name))
                }
                callback(this.response, this.status);
            }
        }

        var params;
        params = {
            "dev_id": preferences.getDevId(),
            "intent": command.name,
            "queries": command.queries,
            "parameters": command.parameters.map(p => p.name)
        }

        xhr.send(JSON.stringify(params));
    }
}

var database = new Database();
export default database;