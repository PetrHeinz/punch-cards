export default class EventManager {
    _events = []
    _callbacksByType = {}
    _callbacks = []

    listen(type, callback) {
        if (this._callbacksByType[type] === undefined) {
            this._callbacksByType[type] = []
        }
        this._callbacksByType[type].push(callback)
        this._events.forEach(event => event.type === type && callback(event.payload))
    }

    listenToAll(callback) {
        this._callbacks.push(callback)
        this._events.forEach(({type, payload}) => callback(type, payload))
    }

    publish(type, payload) {
        console.debug(`[${this._formatTime()}] Published event "${type}":` , payload)
        this._events.push({type, payload})
        this._call(type, payload)
    }

    hasEvent(type) {
        this._events.forEach(event => {
            if (event.type === type) {
                return true
            }
        })
        return false
    }

    clear() {
        this._events = []
    }

    _call(type, payload) {
        if (this._callbacksByType[type] !== undefined) {
            this._callbacksByType[type].forEach(callback => callback(payload))
        }
        this._callbacks.forEach(callback => callback(type, payload))
    }

    _formatTime() {
        const now = new Date();
        return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`
    }
}
