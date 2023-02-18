export default class EventManager {
    _events = []
    _callbacks = {}

    listen(type, callback) {
        if (this._callbacks[type] === undefined) {
            this._callbacks[type] = []
        }
        this._callbacks[type].push(callback)
    }

    publish(type, payload) {
        this._events.push({type, payload})
        this._call(type, payload)
        console.debug(type, payload)
    }

    replay() {
        this._events.forEach(({type, payload}) => this._call(type, payload))
    }

    _call(type, payload) {
        if (this._callbacks[type] !== undefined) {
            this._callbacks[type].forEach(callback => callback(payload))
        }
    }
}
