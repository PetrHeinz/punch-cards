class Game {
    currentAction = 0
    constructor(randomSeedString) {
        randomSeedString = randomSeedString ?? RandomGenerator.randomSeedString(32)
        this.leftRobot = new Robot(CARDS, new RandomGenerator(randomSeedString + "-left"))
        this.rightRobot = new Robot(CARDS, new RandomGenerator(randomSeedString + "-right"))
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
            if (this.leftRobot.actionCards[this.currentAction] !== undefined) {
                actions.push(getAction(this.leftRobot.actionCards[this.currentAction], this.leftRobot, this.rightRobot))
            } else {
                this.leftRobot.state = this.leftRobot.isDestroyed() ? ROBOT_STATE_DEAD : ROBOT_STATE_PREPARE
            }
        }

        if (this.rightRobot.state === ROBOT_STATE_ACTION) {
            if (this.rightRobot.actionCards[this.currentAction] !== undefined) {
                actions.push(getAction(this.rightRobot.actionCards[this.currentAction], this.rightRobot, this.leftRobot))
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

const ROBOT_STATE_CONTROL = "WAITING_FOR_INPUT"
const ROBOT_STATE_COMMIT = "INPUT_ACCEPTED"
const ROBOT_STATE_ACTION = "ACTION"
const ROBOT_STATE_PREPARE = "PREPARING"
const ROBOT_STATE_DEAD = "DISASSEMBLED"
const ROBOT_STATE_WINNER = "WINNER"

const ROBOT_HAND_RIGHT = "RIGHT"
const ROBOT_HAND_LEFT = "LEFT"

class Robot {
    state = ROBOT_STATE_PREPARE
    discardedCards = []
    handCards = []
    actionCards = []
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

        this.actionCards = [null, null, null]
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
    chooseAction(handCardIndex, actionIndex, hand) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can choose action only during " + ROBOT_STATE_CONTROL
        if (hand !== undefined && hand !== ROBOT_HAND_RIGHT && hand !== ROBOT_HAND_LEFT) throw "Unknown hand " + hand

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
    swapActions(firstActionIndex, secondActionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can swap actions only during " + ROBOT_STATE_CONTROL

        if (this.actionCards[firstActionIndex] === undefined) {
            console.debug('actions:', this.actionCards)
            throw "Undefined action index " + firstActionIndex
        }
        if (this.actionCards[secondActionIndex] === undefined) {
            console.debug('actions:', this.actionCards)
            throw "Undefined action index " + secondActionIndex
        }

        const swappedActionCard = this.actionCards[firstActionIndex]
        this.actionCards[firstActionIndex] = this.actionCards[secondActionIndex]
        this.actionCards[secondActionIndex] = swappedActionCard
    }
    toggleActionHand(actionIndex) {
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can choose action hand only during " + ROBOT_STATE_CONTROL

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
        if (this.state !== ROBOT_STATE_CONTROL) throw "Robot can discard action only during " + ROBOT_STATE_CONTROL

        this.actionCards[actionIndex] = null
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
            .map(card => ({ card, sort: this._randomGenerator.nextRandom() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ card }) => card)
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

/**
 * @see https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
class RandomGenerator {
    /**
     * @param {?string} seedString
     */
    constructor(seedString) {
        this.seedString = seedString ?? RandomGenerator.randomSeedString(32)
        this._seed = this._cyrb128(this.seedString)
    }

    /**
     * @return {number}
     */
    nextRandom() {
        return this._xoshiro128ss()
    }

    /**
     * @param {number} length
     * @return {string}
     */
    static randomSeedString(length) {
        let randomString = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return randomString;
    }

    _cyrb128(str) {
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
    }

    _xoshiro128ss() {
        let t = this._seed[1] << 9, r = this._seed[0] * 5; r = (r << 7 | r >>> 25) * 9;
        this._seed[2] ^= this._seed[0]; this._seed[3] ^= this._seed[1];
        this._seed[1] ^= this._seed[2]; this._seed[0] ^= this._seed[3]; this._seed[2] ^= t;
        this._seed[3] = this._seed[3] << 11 | this._seed[3] >>> 21;

        return (r >>> 0) / 4294967296;
    }
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
        case CHARGE: return getChargeAction(robot.getHand(actionCard.hand))
    }
    return {
        prepare: () => {},
        do: () => console.warn("Unknown action card " + actionCard.id),
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
            otherRobot.getBodypartAt(hand.position).health -= hand.isCharged ? 3 * damage : damage
        },
        cleanup: () => {
            hand.isBlocked = false
            hand.isBlocking = true
            hand.isAttacking = false
            hand.isCharged = false
        },
    }
}
/**
 * @param {Hand} hand
 */
function getChargeAction(hand) {
    return {
        prepare: () => {
            hand.isBlocking = false
            hand.isCharged = true
        },
        do: () => {},
        cleanup: () => {},
    }
}
