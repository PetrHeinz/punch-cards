export default class Hand {
    isBlocking = true
    isAttacking = false
    isBlocked = false
    isCharged = false

    _allowPositionOutOfBounds = false

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

    set allowPositionOutOfBounds(allow) {
        this._allowPositionOutOfBounds = allow

        if (!this._allowPositionOutOfBounds) {
            this.position = this._position
        }
    }

    get position() {
        return this._position
    }

    set position(position) {
        this._position = this._allowPositionOutOfBounds ? position : Math.max(this.min, Math.min(position, this.max))
    }
}