export default class ChangeCache {
    constructor(object) {
        this.lastJson = object !== undefined ? JSON.stringify(object) : ''
    }

    ifChanged(object, callback) {
        const json = JSON.stringify(object)
        if (json !== this.lastJson) {
            callback()
        }
        this.lastJson = json
    }
}