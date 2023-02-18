import {BLANK_CARD, CARDS} from "./cards.js";
import {RandomGenerator} from "./randomGenerator";

export default class Game {
    currentAction = 0

    constructor(randomSeedString) {
        randomSeedString = randomSeedString ?? RandomGenerator.randomSeedString(32)
        this.leftRobot = new Robot(CARDS, new RandomGenerator(`${randomSeedString}-left`))
        this.rightRobot = new Robot(CARDS, new RandomGenerator(`${randomSeedString}-right`))
    }

    isOver() {
        if (this.leftRobot.state === ROBOT_STATE_DEAD && this.rightRobot.state === ROBOT_STATE_DEAD) {
            return true
        }

        return this.leftRobot.state === ROBOT_STATE_WINNER || this.rightRobot.state === ROBOT_STATE_WINNER
    }

    tick() {
        if (this.isOver()) {
            console.debug("Game is already over")
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_CONTROL || this.rightRobot.state === ROBOT_STATE_CONTROL) {
            console.debug("Either robot is still waiting for input")
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_DEAD && this.rightRobot.state === ROBOT_STATE_DEAD) {
            console.info("Game over! Mutual annihilation!")
        }

        if (this.leftRobot.state === ROBOT_STATE_PREPARE && this.rightRobot.state === ROBOT_STATE_DEAD) {
            console.info("Game over! Left robot won!")
            this.leftRobot.state = ROBOT_STATE_WINNER
        }

        if (this.leftRobot.state === ROBOT_STATE_DEAD && this.rightRobot.state === ROBOT_STATE_PREPARE) {
            console.info("Game over! Right robot won!")
            this.rightRobot.state = ROBOT_STATE_WINNER
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
            if (this.leftRobot.actions[this.currentAction] !== undefined) {
                actions.push(this.leftRobot.actions[this.currentAction].getAction(this.leftRobot, this.rightRobot))
            } else {
                this.leftRobot.state = this.leftRobot.isDestroyed() ? ROBOT_STATE_DEAD : ROBOT_STATE_PREPARE
            }
        }

        if (this.rightRobot.state === ROBOT_STATE_ACTION) {
            if (this.rightRobot.actions[this.currentAction] !== undefined) {
                actions.push(this.rightRobot.actions[this.currentAction].getAction(this.rightRobot, this.leftRobot))
            } else {
                this.rightRobot.state = this.rightRobot.isDestroyed() ? ROBOT_STATE_DEAD : ROBOT_STATE_PREPARE
            }
        }

        if (this.leftRobot.state === ROBOT_STATE_ACTION || this.rightRobot.state === ROBOT_STATE_ACTION) {
            actions.forEach(action => action.prepare())
            actions.forEach(action => action.do())
            // TODO: think of a better solution, this should be Render's responsibility
            setTimeout(() => actions.forEach(action => action.cleanup()), 500)

            this.currentAction++
        }
    }
}

export const ROBOT_STATE_CONTROL = "WAITING_FOR_INPUT"
export const ROBOT_STATE_COMMIT = "INPUT_ACCEPTED"
export const ROBOT_STATE_ACTION = "ACTION"
export const ROBOT_STATE_PREPARE = "PREPARING"
export const ROBOT_STATE_DEAD = "DISASSEMBLED"
export const ROBOT_STATE_WINNER = "WINNER"

export const ROBOT_HAND_RIGHT = "RIGHT"
export const ROBOT_HAND_LEFT = "LEFT"

export class Robot {
    state = ROBOT_STATE_PREPARE
    discardedCards = []
    handCards = []
    actions = [new Action(), new Action(), new Action()]

    constructor(cards, randomGenerator) {
        this._randomGenerator = randomGenerator;
        this.head = new Bodypart(40)
        this.torso = new Bodypart(80)
        this.heatsink = new Bodypart(60)
        this.rightHand = new Hand(3, 1, 7)
        this.leftHand = new Hand(5, 1, 7)
        this.deckCards = this._buildDeck(cards)
        this.drawHand()
    }

    getHand(hand) {
        if (hand !== ROBOT_HAND_RIGHT && hand !== ROBOT_HAND_LEFT) throw "Unknown hand " + hand

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

    isDestroyed() {
        return [this.head, this.torso, this.heatsink]
            .filter(bodypart => bodypart.health === 0)
            .length > 0
    }

    drawHand() {
        if (this.state !== ROBOT_STATE_PREPARE) throw "Robot can draw hand only during " + ROBOT_STATE_PREPARE

        this.actions.forEach(action => action.discard())
        this.discardedCards = this.discardedCards.concat(this.handCards)
        this.handCards = []
        for (let i = 0; i < 5; i++) {
            if (this.deckCards.length === 0) {
                this.deckCards = this._shuffleCards(this.discardedCards)
                this.discardedCards = []
            }
            this.handCards.push(this.deckCards.shift())
        }

        this.state = ROBOT_STATE_CONTROL

        return this.handCards
    }

    chooseAction(handCardIndex, actionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can choose action only during " + ROBOT_STATE_CONTROL

        if (this.actions[actionIndex] === undefined) {
            console.debug('actions:', this.actions)
            throw "Undefined action index " + actionIndex
        }
        if (this.handCards[handCardIndex] === undefined) {
            console.debug(this.handCards)
            throw "Undefined hand card index " + handCardIndex
        }
        const chosenCard = this.handCards[handCardIndex]
        if (this.actions.map(action => action.card).indexOf(chosenCard) > -1) {
            console.debug("This card has already been chosen")
            this.actions[this.actions.map(action => action.card).indexOf(chosenCard)].card = {...BLANK_CARD}
        }

        this.actions[actionIndex].card = chosenCard
    }

    swapActions(firstActionIndex, secondActionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can swap actions only during " + ROBOT_STATE_CONTROL

        if (this.actions[firstActionIndex] === undefined) {
            console.debug('actions:', this.actions)
            throw "Undefined action index " + firstActionIndex
        }
        if (this.actions[secondActionIndex] === undefined) {
            console.debug('actions:', this.actions)
            throw "Undefined action index " + secondActionIndex
        }

        const swappedAction = this.actions[firstActionIndex]
        this.actions[firstActionIndex] = this.actions[secondActionIndex]
        this.actions[secondActionIndex] = swappedAction
    }

    toggleActionHand(actionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can choose action hand only during " + ROBOT_STATE_CONTROL

        if (this.actions[actionIndex] === undefined) {
            console.debug('actions:', this.actions)
            throw "Undefined action index " + actionIndex
        }

        this.actions[actionIndex].toggleHand()
    }

    discardAction(actionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can discard action only during " + ROBOT_STATE_CONTROL

        this.actions[actionIndex].discard()
    }

    commit() {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can commit only during " + ROBOT_STATE_CONTROL

        this.state = ROBOT_STATE_COMMIT
    }

    _buildDeck(cards) {
        let deck = []
        cards.forEach(card => {
            for (let i = 0; i < card.count; i++) {
                deck.push({...card})
            }
        })

        return this._shuffleCards(deck)
    }

    _shuffleCards(cards) {
        return cards
            .map(card => ({card, sort: this._randomGenerator.nextRandom()}))
            .sort((a, b) => a.sort - b.sort)
            .map(({card}) => card)
    }
}

export class Action {
    card = {...BLANK_CARD}
    hand = ROBOT_HAND_RIGHT

    toggleHand() {
        this.hand = this.hand === ROBOT_HAND_RIGHT ? ROBOT_HAND_LEFT : ROBOT_HAND_RIGHT
    }
    discard() {
        this.card = {...BLANK_CARD}
    }
    getAction(thisRobot, otherRobot) {
        return this.card.getAction(thisRobot.getHand(this.hand), thisRobot, otherRobot)
    }
}

export class Bodypart {
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

export class Hand {
    isBlocking = true
    isAttacking = false
    isBlocked = false
    isCharged = false

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
