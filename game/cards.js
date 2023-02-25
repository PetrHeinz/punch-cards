class Card {
    icon = ""
    name = "N/A"

    get info() {
        return {
            icon: this.icon,
            name: this.name,
        }
    }

    getAction(hand, thisRobot, otherRobot) {
        return {
            prepare: () => this._prepare(hand, thisRobot),
            afterPrepare: () => this._afterPrepare(hand, thisRobot, otherRobot),
            do: () => this._do(hand, thisRobot, otherRobot),
            cleanup: () => this._cleanup(hand, thisRobot),
        }
    }

    _prepare(hand, thisRobot) {
    }

    _afterPrepare(hand, thisRobot, otherRobot) {
    }

    _do(hand, thisRobot, otherRobot) {
    }

    _cleanup(hand, thisRobot) {
    }
}

export class PunchCard extends Card {
    icon = "👊"
    name = "Punch card"

    _prepare(hand) {
        hand.isBlocking = false
        hand.isAttacking = true
    }

    _afterPrepare(hand, thisRobot, otherRobot) {
        hand.isBlocked = otherRobot.getHandsBlockingAt(hand.position).length > 0
    }

    _do(hand, thisRobot, otherRobot) {
        const baseDamage = 10
        const blockedDamage = 8
        const blockingHandsCount = otherRobot.getHandsBlockingAt(hand.position).length
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
    icon = "☝️"
    name = "Up"

    _prepare(hand) {
        hand.position -= 1
    }
}

export class Up2Card extends Card {
    icon = "☝️☝️"
    name = "Uup"

    _prepare(hand) {
        hand.position -= 2
    }
}

export class Up3Card extends Card {
    icon = "☝️☝️☝️"
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

export class PushUpCard extends Card {
    icon = "🖐️☝️"
    name = "Push up"

    _prepare(hand) {
        hand.isBlocking = false
        hand.isAttacking = true
        hand.isBlocked = true
    }
    _do(hand, thisRobot, otherRobot) {
        otherRobot.getHandsBlockingAt(hand.position).forEach(otherHand => otherHand.position--)
    }
    _cleanup(hand, thisRobot) {
        hand.isBlocking = !hand.isCharged
        hand.isAttacking = false
        hand.isBlocked = false
    }
}

export class PushDownCard extends Card {
    icon = "🖐️👇"
    name = "Push down"

    _prepare(hand) {
        hand.isBlocking = false
        hand.isAttacking = true
        hand.isBlocked = true
    }
    _do(hand, thisRobot, otherRobot) {
        otherRobot.getHandsBlockingAt(hand.position).forEach(otherHand => otherHand.position++)
    }
    _cleanup(hand, thisRobot) {
        hand.isBlocking = !hand.isCharged
        hand.isAttacking = false
        hand.isBlocked = false
    }
}

export class HandFlipCard extends Card {
    icon = "👋"
    name = "Hand flip"

    _prepare(hand) {
        hand.position = hand.max - hand.position + hand.min
    }
}

export class FlipPunchCard extends PunchCard {
    icon = "👋👊"
    name = "Flip Punch"

    _prepare(hand) {
        hand.position = hand.max - hand.position + hand.min
        super._prepare(hand)
    }
}

export class UpPunchCard extends PunchCard {
    icon = "☝️👊"
    name = "Up Punch"

    _prepare(hand) {
        hand.min--
        hand.position--
        super._prepare(hand)
    }

    _cleanup(hand) {
        super._cleanup(hand)
        hand.min++
        if (hand.position < hand.min) {
            hand.position = hand.min
        }
    }
}

export class DownPunchCard extends PunchCard {
    icon = "👇👊"
    name = "Down Punch"

    _prepare(hand) {
        hand.max++
        hand.position++
        super._prepare(hand)
    }

    _cleanup(hand) {
        super._cleanup(hand)
        hand.max--
        if (hand.position > hand.max) {
            hand.position = hand.max
        }
    }
}

export class RepairCard extends Card {
    icon = "🔧"
    name = "Repair"

    _prepare(hand) {
        hand.isCharged = false
        hand.isBlocking = false
    }
    _do(hand, thisRobot, otherRobot) {
        thisRobot.getBodypartAt(hand.position).health += 10
    }
    _cleanup(hand, thisRobot) {
        hand.isBlocking = true
    }
}

export class ReinforceCard extends Card {
    icon = "🛠️"
    name = "Reinforce"

    _prepare(hand) {
        hand.isCharged = false
        hand.isBlocking = false
    }
    _do(hand, thisRobot, otherRobot) {
        const thisBodypart = thisRobot.getBodypartAt(hand.position);
        thisBodypart.maxHealth += 10
        thisBodypart.health += 15

        const neighboringBodyparts = thisRobot.getNeighboringBodyparts(thisBodypart)
        neighboringBodyparts.forEach((bodypart) => {
            bodypart.health -= 10 / neighboringBodyparts.length
        })
    }
    _cleanup(hand, thisRobot) {
        hand.isBlocking = true
    }
}

export class BlankCard extends Card {
    icon = "📄"
    name = "Blank"
}

const cards = {
    blank: () => new BlankCard(),
    up1: () => new Up1Card(),
    up2: () => new Up2Card(),
    up3: () => new Up3Card(),
    down1: () => new Down1Card(),
    down2: () => new Down2Card(),
    down3: () => new Down3Card(),
    hand_flip: () => new HandFlipCard(),
    punch: () => new PunchCard(),
    up_flip: () => new UpPunchCard(),
    down_flip: () => new DownPunchCard(),
    flip_punch: () => new FlipPunchCard(),
    charge: () => new ChargeCard(),
    push_up: () => new PushUpCard(),
    push_down: () => new PushDownCard(),
    repair: () => new RepairCard(),
    reinforce: () => new ReinforceCard(),
}

export function getAllTypes() {
    return Object.keys(cards)
}

export function createDeckByTypes(types) {
    const deck = []
    for (const type in types) {
        for (let i = 0; i < types[type]; i++) {
            deck.push(createCardByType(type))
        }
    }
    return deck
}

export function createCardByType(type) {
    return cards[type]()
}
