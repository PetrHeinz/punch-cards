class Card {
    icon = ""
    name = "N/A"

    constructor(type) {
        this._type = type
    }

    get info() {
        return Object.freeze({
            type: this._type,
            icon: this.icon,
            name: this.name,
        })
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

class PunchCard extends Card {
    icon = "👊"
    name = "Punch card"
    damage = 10
    blockedDamage = 8
    description = `Punch the opposing robot. Punch it. That's what it's all about. Deals ${this.damage} damage. Blocking hand will lower the resulting damage by ${this.blockedDamage}.`

    _prepare(hand) {
        hand.isBlocking = false
        hand.isAttacking = true
    }

    _afterPrepare(hand, thisRobot, otherRobot) {
        hand.isBlocked = otherRobot.getHandsBlockingAt(hand.position).length > 0
    }

    _do(hand, thisRobot, otherRobot) {
        const blockingHandsCount = otherRobot.getHandsBlockingAt(hand.position).length
        const damage = Math.max(0, this.damage - blockingHandsCount * this.blockedDamage)
        otherRobot.getBodypartAt(hand.position).health -= hand.damageMultiplier * damage
    }

    _cleanup(hand) {
        hand.isBlocked = false
        hand.isBlocking = true
        hand.isAttacking = false
        hand.isCharged = false
    }
}

class Up1Card extends Card {
    icon = "☝️"
    name = "Raise"
    description = "Moves your hand up by one position."

    _prepare(hand) {
        hand.position -= 1
    }
}

class Up2Card extends Card {
    icon = "☝️❗"
    name = "Raise by two"
    description = "Moves your hand up two positions closer to the head."

    _prepare(hand) {
        hand.position -= 2
    }
}

class Up3Card extends Card {
    icon = "☝️‼️"
    name = "Triple Raise"
    description = "Moves your hand up three positions in a single action."

    _prepare(hand) {
        hand.position -= 3
    }
}

class Down1Card extends Card {
    icon = "👇"
    name = "Lower"
    description = "Moves your hand down by one position."

    _prepare(hand) {
        hand.position += 1
    }
}

class Down2Card extends Card {
    icon = "👇❗"
    name = "Lower by two"
    description = "Moves your hand down two positions closer to the heatsink below."

    _prepare(hand) {
        hand.position += 2
    }
}

class Down3Card extends Card {
    icon = "👇‼️"
    name = "Triple Lower"
    description = "Moves your hand down three positions in a single action."

    _prepare(hand) {
        hand.position += 3
    }
}

class ChargeCard extends Card {
    icon = "💥"
    name = "Charge"
    damageMultiplier = 3
    description = `Prepares your hand to give increased damage for the next punch, but it cannot block. Will multiple next resulting damage by ${this.damageMultiplier}.`

    _prepare(hand) {
        hand.isBlocking = false
        hand.damageMultiplier = this.damageMultiplier
    }
}

class PushUpCard extends Card {
    icon = "🖐️☝️"
    name = "Nudge up"
    description = "Forces opponent's blocking hand in this position to move down by one, breaking through their guard and creating an opening for attack."

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

class PushDownCard extends Card {
    icon = "🖐️👇"
    name = "Nudge down"
    description = "Forces opponent's blocking hand in this position to move down by one, disrupting their strategy and creating an opening for attack."

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

class HandFlipCard extends Card {
    icon = "👋"
    name = "Mirror Hand"
    description = "This card commands the hand to switch to the opposite position, confusing opponents and creating new attack angles."

    _prepare(hand) {
        hand.position = hand.max - hand.position + hand.min
    }
}

class FlipPunchCard extends PunchCard {
    icon = "👋👊"
    name = "Mirror Punch"
    description = `Punch the opposing robot in an opposite position, creating unexpected attack pattern and potentially overwhelming the opponent's defenses. Deals ${this.damage} damage.`

    _prepare(hand) {
        hand.position = hand.max - hand.position + hand.min
        super._prepare(hand)
    }
}

class UpPunchCard extends PunchCard {
    icon = "☝️👊"
    name = "Raise Punch"
    description = `Punch the opposing robot with the hand in a higher position, dealing damage and potentially knocking them off balance. Deals ${this.damage} damage. Attack will miss in the topmost position.`

    _prepare(hand) {
        hand.allowPositionOutOfBounds = true
        hand.position--
        super._prepare(hand)
    }

    _cleanup(hand) {
        super._cleanup(hand)
        hand.allowPositionOutOfBounds = false
    }
}

class DownPunchCard extends PunchCard {
    icon = "👇👊"
    name = "Lower Punch"
    description = `Punch the opposing robot with the hand in a lower position, delivering a low blow and potentially disrupting their strategy. Deals ${this.damage} damage. Attack will miss in the lowest position.`

    _prepare(hand) {
        hand.allowPositionOutOfBounds = true
        hand.position++
        super._prepare(hand)
    }

    _cleanup(hand) {
        super._cleanup(hand)
        hand.allowPositionOutOfBounds = false
    }
}

class RepairCard extends Card {
    icon = "🔧"
    name = "Repair"
    healthIncrease = 10
    description = `Restores ${this.healthIncrease} HP to the bodypart in the current lane, repairing damage and strengthening the robot's defenses.`

    _prepare(hand) {
        hand.isCharged = false
        hand.isBlocking = false
    }
    _do(hand, thisRobot, otherRobot) {
        thisRobot.getBodypartAt(hand.position).health += this.healthIncrease
    }
    _cleanup(hand, thisRobot) {
        hand.isBlocking = true
    }
}

class ReinforceCard extends Card {
    icon = "🛠️"
    name = "Brace up"
    maxHealthIncrease = 10
    healthIncrease = 15
    neighborsHealthDecrease = 10
    description = `Reinforces the bodypart in the current lane, increasing its maximum HP by ${this.maxHealthIncrease} and restoring ${this.healthIncrease} HP. However, neighboring bodyparts lose ${this.neighborsHealthDecrease} HP in total as their energy shifts to accommodate the strengthened part.`

    _prepare(hand) {
        hand.isCharged = false
        hand.isBlocking = false
    }

    _do(hand, thisRobot, otherRobot) {
        const thisBodypart = thisRobot.getBodypartAt(hand.position)
        thisBodypart.maxHealth += this.maxHealthIncrease
        thisBodypart.health += this.healthIncrease

        const neighboringBodyparts = thisRobot.getNeighboringBodyparts(thisBodypart)
        neighboringBodyparts.forEach((bodypart) => {
            bodypart.health -= this.neighborsHealthDecrease / neighboringBodyparts.length
        })
    }
    _cleanup(hand, thisRobot) {
        hand.isBlocking = true
    }
}

class BlankCard extends Card {
    icon = "📄"
    name = "Idle"
    description = "This card commands the hand to stay in the current position, conserving energy and waiting for the right moment to strike. In other words, it does nothing."
}

const CARDS = {
    blank: BlankCard,
    up1: Up1Card,
    up2: Up2Card,
    up3: Up3Card,
    down1: Down1Card,
    down2: Down2Card,
    down3: Down3Card,
    hand_flip: HandFlipCard,
    punch: PunchCard,
    up_flip: UpPunchCard,
    down_flip: DownPunchCard,
    flip_punch: FlipPunchCard,
    charge: ChargeCard,
    push_up: PushUpCard,
    push_down: PushDownCard,
    repair: RepairCard,
    reinforce: ReinforceCard,
}

export function createBlankCard() {
    return createCardByType('blank')
}

export function getAllTypes() {
    return Object.keys(CARDS)
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
    return Object.freeze(new CARDS[type](type))
}
