export default class Bodypart {
    constructor(health) {
        this.maxHealth = health
        this.health = health
    }

    get info() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
        }
    }

    get health() {
        return this._health
    }

    set health(health) {
        this._health = Math.min(Math.max(0, health), this.maxHealth)
    }
}