import { Paths } from "./constants";

const lodashId = require('lodash-id')
const low = require('lowdb');
const FileSync = window.require('lowdb/adapters/FileSync');

class Preferences {

    constructor() {
        this.dir = null;
        this.adapter = null;
        this.db = null;

        this.configureProject = this.configureProject.bind(this);
    }

    /* Config method to set user's project directory */
    configureProject(dir) {
        this.dir = dir;
        this.prefsPath = this.dir + Paths.Preferences;
        this.adapter = new FileSync(this.prefsPath);
        this.db = low(this.adapter);
        this.db._.mixin(lodashId)
    }

    getDevId() {
        return this.db.get('dev_id').value();
    }

    setDevId(devId) {
        this.db.assign({ 'dev_id': devId }).write();
    }
}

var preferences = new Preferences();
export default preferences;