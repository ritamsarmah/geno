import events from 'events';

class Emitter {

    constructor() {
        this.em = new events.EventEmitter();
    }

    on(event, listener) {
        this.em.on(event, listener);
    }

    once(event, listener) {
        this.em.once(event, listener);
    }

    emit(event, ...args) {
        this.em.emit(event, args);
    }

    removeListener(event, listener) {
        this.em.removeListener(event, listener);
    }

}

var emitter = new Emitter();
export default emitter;