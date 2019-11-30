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

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                this.db.get('commands').getById(commandId).get('queries').updateById(updatedQuery.id, updatedQuery).write();
                if (xhr.status === 200) {
                    // Only update if successful request
                    var json = JSON.parse(xhr.responseText);
                    console.log("JSON", json);
                    updatedQuery.entities = json.entities
                    this.analyzeEntities(commandId, json.entities);
                }
                callback(this.getCommandForId(commandId), this.getQueryForId(commandId, updatedQuery.id));
            }
        };

        xhr.send(JSON.stringify({
            "dev_id": 1,
            "intent": this.getCommandForId(commandId).name,
            "old_query": oldText,
            "new_query": updatedQuery.query
        }));
    }

    removeQuery(commandId, queryId) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/query/delete');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.send(JSON.stringify({
            "dev_id": 1,
            "intent": this.getCommandForId(commandId).name,
            "query": this.getQueryForId(commandId, queryId).query
        }));

        this.db.get('commands').getById(commandId).get('queries').removeById(queryId).write();
        return this.getCommandForId(commandId);
    }

    swapEntityNames(commandId, queryId, first, second) {
        var firstEntity = this.db.get('commands').getById(commandId).get('queries').getById(queryId).get('entities').find({ entity: first });
        var secondEntity = this.db.get('commands').getById(commandId).get('queries').getById(queryId).get('entities').find({ entity: second });
        firstEntity.assign({ entity: second }).write();
        secondEntity.assign({ entity: first }).write();
        // TODO: network request to model to tell it about changes
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    analyzeEntities(commandId, entities) {
        console.log("LE", entities);
        entities.forEach(ex => {
            var entities = [];

            if ('entities' in ex) {
                var entityStartIndices = {}

                ex.entities.forEach(entity => {
                    entityStartIndices[entity.start] = entity;
                });

                var startIndex = 0;
                var endIndex = 0;
                // Create new "entity" objects for non-entities
                loop1:
                while (endIndex < ex.text.length) {
                    // Skip pre-discovered entities
                    while (startIndex in entityStartIndices) {
                        entities.push(entityStartIndices[startIndex]);
                        startIndex = entityStartIndices[startIndex].end + 1;
                        endIndex = startIndex;

                        // Reached end of string
                        if (startIndex >= ex.text.length) {
                            break loop1;
                        }
                    }

                    // Reached non-entity, lengthen substring until next pre-discovered entity found
                    // Can modify to be per word split by adding "&& ex.text[endIndex] !== ' '"
                    while (!(endIndex in entityStartIndices) && endIndex <= ex.text.length) {
                        endIndex++;
                    }

                    entities.push({
                        start: startIndex,
                        end: endIndex - 1,
                        entity: null
                    });

                    startIndex = endIndex;
                }
            }

            this.db
                .get('commands').getById(commandId)
                .get('queries').find({ query: ex.text }) // FIXME: Match using queryId, instead of text (will need to send queryId to backend)
                .assign({ entities: entities })
                .write()
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

    updateBackupQuery(commandId, parameter, backupQuery) {
        this.db.get('commands').getById(commandId).get('parameters').find({ name: parameter }).assign({ backupQuery: backupQuery }).write();
        return this.getCommandForId(commandId);
    }

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