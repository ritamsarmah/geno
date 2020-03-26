import { Paths, ContextType } from "./constants";
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

    /* Get command prototype */
    getCommandPrototype(type, parameters) {
        return {
            name: "untitled_command" + (this.getCommands().length + 1),
            parameters: parameters,
            queries: [],
            isTrained: false,
            contextInfo: {
                parameter: null,
                type: ContextType.Element,
                selector: "*",
                allAttributes: [],      // list of detected attributes for the selector
                attributes: [],         // list of selected attributes
                attributeExamples: []   // list of example values for detected attributes
            },
            type: type
        }
    }

    /* Add a command */
    addCommand(file, triggerFn, params) {
        var parameters = params.map((p) => {
            return { name: p, backupQuery: "" }
        });
        var cmd = this.getCommandPrototype("function", parameters);
        cmd.file = file;
        cmd.triggerFn = triggerFn;

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
        var cmd = this.getCommandPrototype("demo", parameters)
        cmd.elements = elements;
        cmd.file = file;
        cmd.delay = 0;

        this.db.get('commands').insert(cmd).write()
        return cmd;
    }

    /* Update a command */
    updateCommand(id, data) {
        this.db.get('commands').getById(id).assign(data).write();
        return this.getCommandForId(id);
    }

    /* Update command context info */
    updateCommandContext(id, data) {
        this.db.get('commands').getById(id).get('contextInfo').assign(data).write();
        return this.getCommandForId(id);
    }

    /* Remove a command */
    removeCommand(id) {
        this.sendBackendRequest("intent/delete", {
            "dev_id": preferences.getDevId(),
            "intent": this.getCommandForId(id).name,
        });
        return this.db.get('commands').removeById(id).write();
    }

    /*** Query Functions ***/

    /* Get query for ID */
    getQueryForId(commandId, queryId) {
        return this.db.get('commands').getById(commandId).get('queries').getById(queryId).value();
    }

    /* Add a query to a command */
    addQuery(commandId, queryText) {
        var data = {
            text: queryText,
            entities: this.splitIntoEntities(queryText)
        };
        this.db.get('commands').getById(commandId).get('queries').insert(data).write();
        return this.getCommandForId(commandId);
    }

    /* Make changes to a query and train model */
    updateQuery(commandId, oldText, updatedQuery, callback) {
        var command = this.getCommandForId(commandId);

        // Don't make changes if old text and new text are the same
        if (oldText === updatedQuery.text) {
            callback(command, this.getQueryForId(commandId, updatedQuery.id));
            return;
        }

        this.sendBackendRequest("query/update", {
            "dev_id": preferences.getDevId(),
            "intent": command.name,
            "old_text": oldText,
            "new_query": updatedQuery
        }, (xhr, error) => {
            if (error) {
                console.log(error);
            } else {
                updatedQuery.entities = this.splitIntoEntities(updatedQuery.text)
                this.db.get('commands').getById(commandId).get('queries')
                    .updateById(updatedQuery.id, updatedQuery).write();

                callback(this.getCommandForId(commandId), this.getQueryForId(commandId, updatedQuery.id));
            }
        });
    }

    /* Delete a query and train model */
    removeQuery(commandId, queryId) {
        this.sendBackendRequest('query/delete', {
            "dev_id": preferences.getDevId(),
            "intent": this.getCommandForId(commandId).name,
            "query": this.getQueryForId(commandId, queryId).text
        }, (xhr, error) => {
            if (error) console.log(error);
        });

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

    /* Change parameters for command */
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

    /* Change entity to map multimodal input */
    updateContextParameter(commandId, parameter) {
        this.updateCommandContext(commandId, { parameter: parameter });
        return this.getCommandForId(commandId);
    }

    /* Change selector for elements to match context */
    updateContextSelector(commandId, selector) {
        this.updateCommandContext(commandId, { selector: selector });
        return this.getCommandForId(commandId);
    }

    /* Change element attribute(s) to return as a parameter for multimodal input */
    updateContextAttributes(commandId, attributes) {
        this.updateCommandContext(commandId, { attributes: attributes });
        return this.getCommandForId(commandId);
    }

    /* Toggle element attribute in list of return attributes */
    toggleContextAttribute(commandId, attribute) {
        var command = this.getCommandForId(commandId);
        var attributes = command.contextInfo.attributes;
        if (attributes.includes(attribute)) {
            attributes = attributes.filter(attr => attr !== attribute);
        } else {
            attributes.push(attribute);
        }

        if (attributes.length === 0) {
            this.updateContextType(commandId, ContextType.Element);
        } else {
            this.updateContextType(commandId, ContextType.Attribute);
        }

        return this.updateContextAttributes(commandId, attributes);
    }

    /* Change context type for multimodal */
    updateContextType(commandId, type) {
        this.updateCommandContext(commandId, { type: type });
        return this.getCommandForId(commandId);
    }

    /* Reset information about context */
    clearContextInfo(commandId) {
        var command = this.getCommandForId(commandId);
        this.updateCommandContext(commandId, {
            type: command.contextInfo.type === ContextType.Text ? ContextType.Text : ContextType.Element,
            selector: "*",
            allAttributes: [],
            attributes: []
        });
        return this.getCommandForId(commandId)
    }

    /*** Demo Command Functions ***/

    /* Change delay */
    updateDelay(commandId, delay) {
        this.db.get('commands').getById(commandId).assign({ delay: delay }).write();
        return this.getCommandForId(commandId);
    }

    /*** Training ***/

    trainModel(commandId, callback) {
        var command = this.getCommandForId(commandId)

        this.sendBackendRequest('intent/train', {
            "dev_id": preferences.getDevId(),
            "intent": command.name,
            "queries": command.queries,
            "parameters": command.parameters.map(p => p.name)
        }, (xhr, error) => {
            if (error) {
                console.log(error);
            } else {
                this.updateCommand(commandId, { "isTrained": true });

                // Add entity information for command
                var json = JSON.parse(xhr.responseText);
                this.parseEntityResponse(commandId,
                    json['rasa_nlu_data']['common_examples'].filter(ex => ex.intent === command.name))
            }
            callback(error);
        });
    }

    /*** Utility Functions ***/
    
    sendBackendRequest(endpoint, body, completion) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", `http://localhost:3313/${endpoint}`);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(body));
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                var error = (xhr.status === 200) ? null : xhr.responseText;
                if (completion) completion(xhr, error);
            }
        }
    }

    splitIntoEntities(text) {
        var words = text.split(" ");
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

        return entities;
    }
}

var database = new Database();
export default database;