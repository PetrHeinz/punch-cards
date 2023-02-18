export default class EventManager {
    _events = []
    _callbacksByType = {}
    _callbacks = []

    listen(type, callback, withReplay = true) {
        if (this._callbacksByType[type] === undefined) {
            this._callbacksByType[type] = []
        }
        this._callbacksByType[type].push(callback)
        this._events.forEach(({eventType, payload}) => eventType === type && callback(payload))
    }

    listenToAll(callback) {
        this._callbacks.push(callback)
        this._events.forEach(({type, payload}) => callback(type, payload))
    }

    publish(type, payload) {
        this._events.push({type, payload})
        this._call(type, payload)
        console.debug(type, payload)
    }

    _call(type, payload) {
        if (this._callbacksByType[type] !== undefined) {
            this._callbacksByType[type].forEach(callback => callback(payload))
        }
        this._callbacks.forEach(callback => callback(type, payload))
    }
}
