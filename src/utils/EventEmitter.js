export default class EventEmitter {
    constructor() {
        this.eventObj = {}
    }
    on(eventName, fn) {
        if (!this.eventObj[eventName]) {
            this.eventObj[eventName] = []
        }
        this.eventObj[eventName].push(fn)
    }
    emit(eventName, ...arg) {
        if (!!this.eventObj[eventName]) {
            this.eventObj[eventName].forEach((item, i) => {
                if (typeof item === 'function') {
                    item.apply(this, arg);
                } else {
                    throw Errow(item + 'not a function!')
                }
            })
        }
    }
}