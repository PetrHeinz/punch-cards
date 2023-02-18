export class Card {
    icon = ""
    name = "N/A"

    getAction(hand, thisRobot, otherRobot) {
        return {
            prepare: () => this._prepare(hand, thisRobot, otherRobot),
            do: () => this._do(hand, thisRobot, otherRobot),
            cleanup: () => this._cleanup(hand, thisRobot, otherRobot),
        }
    }

    _prepare(hand, thisRobot, otherRobot) {
    }

    _do(hand, thisRobot, otherRobot) {
    }

    _cleanup(hand, thisRobot, otherRobot) {
    }
}

export class PunchCard extends Card {
    icon = "👊"
    name = "Punch card"

    _prepare(hand) {
        hand.isBlocking = false
        hand.isAttacking = true
    }

    _do(hand, thisRobot, otherRobot) {
        const baseDamage = 10;
        const blockedDamage = 8;
        const blockingHandsCount = otherRobot.getHandsBlockingAt(hand.position).length;
        hand.isBlocked = blockingHandsCount > 0
        const damage = Math.max(0, baseDamage - blockingHandsCount * blockedDamage)
        otherRobot.getBodypartAt(hand.position).health -= hand.isCharged ? 3 * damage : damage
    }

    _cleanup(hand) {
        hand.isBlocked = false
        hand.isBlocking = true
        hand.isAttacking = false
        hand.isCharged = false
    }
}

export class Up1Card extends Card {
    icon = "👆"
    name = "Up"

    _prepare(hand) {
        hand.position -= 1
    }
}

export class Up2Card extends Card {
    icon = "👆👆"
    name = "Uup"

    _prepare(hand) {
        hand.position -= 2
    }
}

export class Up3Card extends Card {
    icon = "👆👆👆"
    name = "Uuup"

    _prepare(hand) {
        hand.position -= 3
    }
}

export class Down1Card extends Card {
    icon = "👇"
    name = "Down"

    _prepare(hand) {
        hand.position += 1
    }
}

export class Down2Card extends Card {
    icon = "👇👇"
    name = "Doown"

    _prepare(hand) {
        hand.position += 2
    }
}

export class Down3Card extends Card {
    icon = "👇👇👇"
    name = "Dooown"

    _prepare(hand) {
        hand.position += 3
    }
}

export class ChargeCard extends Card {
    icon = "💥"
    name = "Charge"

    _prepare(hand) {
        hand.isBlocking = false
        hand.isCharged = true
    }
}

export class BlankCard extends Card {
    icon = "📄"
    name = "Blank"
}

/** @return {Card[]} */
export function createDeck() {
    return [
        new PunchCard(),
        new PunchCard(),
        new PunchCard(),
        new PunchCard(),
        new PunchCard(),
        new PunchCard(),
        new Up1Card(),
        new Up1Card(),
        new Up1Card(),
        new Up2Card(),
        new Up2Card(),
        new Up3Card(),
        new Down1Card(),
        new Down1Card(),
        new Down1Card(),
        new Down2Card(),
        new Down2Card(),
        new Down3Card(),
        new ChargeCard(),
        new ChargeCard(),
    ]
}
