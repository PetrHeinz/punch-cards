class Game {
    currentAction = 0
    constructor() {
        this.leftRobot = new Robot(CARDS)
        this.rightRobot = new Robot(CARDS)
    }

    tick() {
        if (this.leftRobot.state === ROBOT_STATE_CONTROL || this.rightRobot.state === ROBOT_STATE_CONTROL) {
            console.debug("Either robot is still waiting for input")
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_COMMIT && this.rightRobot.state === ROBOT_STATE_COMMIT) {
            console.info("Starting action!")
            this.leftRobot.state = ROBOT_STATE_ACTION
            this.rightRobot.state = ROBOT_STATE_ACTION
        }

        if (this.leftRobot.state === ROBOT_STATE_PREPARE && this.rightRobot.state === ROBOT_STATE_PREPARE) {
            console.info("Preparing for new round!")
            this.currentAction = 0
            this.leftRobot.drawHand()
            this.rightRobot.drawHand()
        }

        let actions = []

        if (this.leftRobot.state === ROBOT_STATE_ACTION) {
            if (this.leftRobot.actionCards[this.currentAction] !== undefined) {
                actions.push(getAction(this.leftRobot.actionCards[this.currentAction], this.leftRobot, this.rightRobot))
            } else {
                this.leftRobot.state = ROBOT_STATE_PREPARE
            }
        }

        if (this.rightRobot.state === ROBOT_STATE_ACTION) {
            if (this.rightRobot.actionCards[this.currentAction] !== undefined) {
                actions.push(getAction(this.rightRobot.actionCards[this.currentAction], this.rightRobot, this.leftRobot))
            } else {
                this.rightRobot.state = ROBOT_STATE_PREPARE
            }
        }

        actions.forEach(action => action.prepare())
        actions.forEach(action => action.do())
        // TODO: think of a better solution, this should be Render's responsibility
        setTimeout(() => actions.forEach(action => action.cleanup()), 500)

        if (this.leftRobot.state === ROBOT_STATE_ACTION || this.rightRobot.state === ROBOT_STATE_ACTION) {
            this.currentAction++
        }
    }
}

ROBOT_STATE_CONTROL = "CONTROL"
ROBOT_STATE_COMMIT = "COMMIT"
ROBOT_STATE_ACTION = "ACTION"
ROBOT_STATE_PREPARE = "PREPARE"

ROBOT_HAND_RIGHT = "RIGHT"
ROBOT_HAND_LEFT = "LEFT"

class Robot {
    state = ROBOT_STATE_PREPARE
    discardedCards = []
    handCards = []
    actionCards = []
    constructor(cards) {
        this.head = new Bodypart(40)
        this.torso = new Bodypart(80)
        this.heatsink = new Bodypart(60)
        this.rightHand = new Hand(3, 1, 7)
        this.leftHand = new Hand(5, 1, 7)
        this.deckCards = buildDeck(cards)
        this.drawHand()
    }
    getHand(hand) {
        if (hand !== ROBOT_HAND_RIGHT && hand !== ROBOT_HAND_LEFT) throw "Unknown hand"

        return hand === ROBOT_HAND_RIGHT ? this.rightHand : this.leftHand
    }
    getBodypartAt(position) {
        switch (position) {
            case 1:
            case 2:
                return this.head
            case 3:
            case 4:
            case 5:
                return this.torso
            case 6:
            case 7:
                return this.heatsink
        }
        throw "Unexpected position " + position
    }
    getHandsBlockingAt(position) {
        return [this.rightHand, this.leftHand]
            .filter(hand => hand.isBlocking)
            .filter(hand => hand.position === position || hand.position === position + 1)
    }
    drawHand() {
        if (this.state !== ROBOT_STATE_PREPARE) throw "Robot can draw hand only during PREPARE"

        this.actionCards = [null, null, null]
        this.discardedCards = this.discardedCards.concat(this.handCards)
        this.handCards = []
        for (let i = 0; i < 5; i++) {
            if (this.deckCards.length === 0) {
                this.deckCards = shuffleCards(this.discardedCards)
                this.discardedCards = []
            }
            this.handCards.push(this.deckCards.shift())
        }

        this.state = ROBOT_STATE_CONTROL

        return this.handCards
    }
    chooseAction(handCardIndex, actionIndex, hand) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can choose action only during CONTROL"
        if (hand !== undefined && hand !== ROBOT_HAND_RIGHT && hand !== ROBOT_HAND_LEFT) throw "Unknown hand"

        if (this.actionCards[actionIndex] === undefined) {
            console.debug('actions:', this.actionCards)
            throw "Undefined action index " + actionIndex
        }
        if (this.handCards[handCardIndex] === undefined) {
            console.debug(this.handCards)
            throw "Undefined hand card index " + handCardIndex
        }
        const chosenCard = this.handCards[handCardIndex]
        if (this.actionCards.indexOf(chosenCard) > -1) {
            console.debug("This card has already been chosen")
            this.actionCards[this.actionCards.indexOf(chosenCard)] = null
        }

        this.actionCards[actionIndex] = chosenCard
        this.actionCards[actionIndex].hand = hand ?? this.actionCards[actionIndex].hand ?? ROBOT_HAND_RIGHT
    }
    toggleActionHand(actionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can choose action hand only during CONTROL"

        if (this.actionCards[actionIndex] === undefined) {
            console.debug('actions:', this.actionCards)
            throw "Undefined action index " + actionIndex
        }

        if (this.actionCards[actionIndex] === null) {
            console.debug('actions:', this.actionCards)
            throw "No action at index " + actionIndex
        }

        this.actionCards[actionIndex].hand = this.actionCards[actionIndex].hand === ROBOT_HAND_RIGHT ? ROBOT_HAND_LEFT : ROBOT_HAND_RIGHT
    }
    discardAction(actionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can discard action only during CONTROL"

        this.actionCards[actionIndex] = null
    }
    commit() {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can commit only during CONTROL"

        this.state = ROBOT_STATE_COMMIT
    }
}

class Bodypart {
    constructor(health) {
        this.health = health
    }
    get health() {
        return this._health
    }
    set health(health) {
        this._health = Math.max(0, health)
    }
}

class Hand {
    isBlocking = true
    isAttacking = false
    isBlocked = false
    constructor(position, min, max) {
        this.min = min
        this.max = max
        this.position = position
    }
    get position() {
        return this._position
    }
    set position(position) {
        this._position = Math.max(this.min, Math.min(position, this.max))
    }
}

function buildDeck(cards) {
    let deck = []
    cards.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({...card})
        }
    })

    return shuffleCards(deck)
}

function shuffleCards(cards) {
    return cards
        .map(card => ({ card, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ card }) => card)
}

/**
 * @param {{id:string,hand:string}} actionCard
 * @param {Robot} robot
 * @param {Robot} otherRobot
 */
function getAction(actionCard, robot, otherRobot) {
    if (actionCard === null) {
        return {
            prepare: () => {},
            do: () => {},
            cleanup: () => {},
        }
    }
    switch (actionCard.id) {
        case PUNCH_CARD: return getPunchAction(robot.getHand(actionCard.hand), otherRobot)
        case UP1: return getMoveAction(-1, robot.getHand(actionCard.hand))
        case UP2: return getMoveAction(-2, robot.getHand(actionCard.hand))
        case UP3: return getMoveAction(-3, robot.getHand(actionCard.hand))
        case DOWN1: return getMoveAction(1, robot.getHand(actionCard.hand))
        case DOWN2: return getMoveAction(2, robot.getHand(actionCard.hand))
        case DOWN3: return getMoveAction(3, robot.getHand(actionCard.hand))
    }
    return {
        prepare: () => {},
        do: () => console.log("Unknown action card " + actionCard.id),
        cleanup: () => {},
    }
}
/**
 * @param {number} amount
 * @param {Hand} hand
 */
function getMoveAction(amount, hand) {
    return {
        prepare: () => { hand.position += amount },
        do: () => {},
        cleanup: () => {},
    }
}
/**
 * @param {Hand} hand
 * @param {Robot} otherRobot
 */
function getPunchAction(hand, otherRobot) {
    return {
        prepare: () => {
            hand.isBlocking = false
            hand.isAttacking = true
        },
        do: () => {
            const baseDamage = 10;
            const blockedDamage = 8;
            const blockingHandsCount = otherRobot.getHandsBlockingAt(hand.position).length;
            hand.isBlocked = blockingHandsCount > 0
            const damage = Math.max(0, baseDamage - blockingHandsCount * blockedDamage)
            otherRobot.getBodypartAt(hand.position).health -= damage
        },
        cleanup: () => {
            hand.isBlocked = false
            hand.isBlocking = true
            hand.isAttacking = false
        },
    }
}
