import { Paths } from "./constants";

const lodashId = require('lodash-id')
const low = require('lowdb');
const FileSync = window.require('lowdb/adapters/FileSync');

const MODAL_VOICE = "voice";
const MODAL_MOUSE = "mouse";
const MODAL_KEY = "keyboard";

class Database {

    constructor() {
        this.dir = null;
        this.adapter = null;
        this.db = null;
        this.modalities = [MODAL_VOICE, MODAL_MOUSE];

        this.configureProject = this.configureProject.bind(this);
        this.addQuery = this.addQuery.bind(this);
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
            return { name: p, modality: MODAL_VOICE, backupQuery: "" }
        });
        var cmd = {
            name: "untitled_command" + (this.getCommands().length + 1),
            file: file,
            triggerFn: triggerFn,
            parameters: parameters,
            queries: [],
            isTrained: false,
            type: "function"
        };

        this.db.get('commands').insert(cmd).write()
        return cmd;
    }

    /* Add a command for programming by demo */
    addDemoCommand(elements, file) {
        var cmd = {
            name: "untitled_command" + (this.getCommands().length + 1),
            elements: elements,
            file: file,
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
            "dev_id": 1,
            "intent": this.getCommandForId(id).name,
        }));

        return this.db.get('commands').removeById(id).write();
    }

    /*** Query Functions ***/

    getQueryForId(commandId, queryId) {
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    addQuery(commandId, queryText) {
        var words = queryText.split(" ");
        var entities = {};

        // Map start index to entity info
        var index = 0;
        words.forEach(word => {
            entities[index] = {
                entity: null,
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

    updateQuery(commandId, oldText, updatedQuery, callback) {
        // Perform entity analysis and execute callback
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/query/update');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                this.db.get('commands').getById(commandId).get('queries').updateById(updatedQuery.id, updatedQuery).write();
                if (xhr.status === 200) {
                    // Only update if successful request
                    var json = JSON.parse(xhr.responseText);
                    console.log("JSON", json);
                    updatedQuery.entities = json.entities
                    // this.analyzeEntities(commandId, json.entities); TODO: Remove?
                }
                callback(this.getCommandForId(commandId), this.getQueryForId(commandId, updatedQuery.id));
            }
        };

        xhr.send(JSON.stringify({
            "dev_id": 1,
            "intent": this.getCommandForId(commandId).name,
            "old_query": oldText,
            "new_query": updatedQuery.text
        }));
    }

    removeQuery(commandId, queryId) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/query/delete');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.send(JSON.stringify({
            "dev_id": 1,
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
            .assign({ entity: label }).write();

        // NOTE: We don't inform backend until developer manually trains model
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    // Parse data from backend and convert it into representation for our database
    // TODO: Do we even need this since we are only manually labelling entities based on dev input
    analyzeEntities(commandId, entities) {
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
                            "entity": en.entity
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
            return oldParam ? oldParam : { name: p, modality: MODAL_VOICE, backupQuery: "" }
        });
        command.assign({ parameters: newParams }).write();
    }

    updateBackupQuery(commandId, parameter, backupQuery) {
        this.db.get('commands').getById(commandId).get('parameters').find({ name: parameter }).assign({ backupQuery: backupQuery }).write();
        return this.getCommandForId(commandId);
    }

    updateModality(commandId, parameter, modality) {
        this.db.get('commands').getById(commandId).get('parameters').find({ name: parameter }).assign({ modality: modality }).write();
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
                    thisDb.analyzeEntities(commandId,
                        json['rasa_nlu_data']['common_examples'].filter(ex => ex.intent === command.name))
                }
                callback(this.response, this.status);
            }
        }

        var params;
        if (command.type === "demo") {
            params = {
                "dev_id": 1,
                "intent": command.name,
                "queries": command.queries.map(q => q.text),
                "parameters": []
            }
        } else if (command.type === "function") {
            params = {
                "dev_id": 1,
                "intent": command.name,
                "queries": command.queries.map(q => q.text),
                "parameters": command.parameters.map(q => q.name)
            }
        }

        xhr.send(JSON.stringify(params));
    }
}

var database = new Database();
export default database;