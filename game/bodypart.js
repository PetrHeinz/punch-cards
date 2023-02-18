export default class Bodypart {
    constructor(health) {
        this.health = health
    }

    get info() {
        return {
            health: this.health,
        }
    }

    get health() {
        return this._health
    }

    set health(health) {
        this._health = Math.max(0, health)
    }
}