export default class Hand {
    isBlocking = true
    isAttacking = false
    isBlocked = false
    isCharged = false

    constructor(position, min, max) {
        this.min = min
        this.max = max
        this.position = position
    }

    get info() {
        return {
            position: this.position,
            isBlocking: this.isBlocking,
            isAttacking: this.isAttacking,
            isBlocked: this.isBlocked,
            isCharged: this.isCharged,
        }
    }

    get position() {
        return this._position
    }

    set position(position) {
        this._position = Math.max(this.min, Math.min(position, this.max))
    }
}