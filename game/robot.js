import Action from "./action.js";
import Bodypart from "./bodypart.js";
import Hand from "./hand.js";
import {createBlankCard, createDeckByTypes} from "./cards.js";
import RandomGenerator from "../utils/randomGenerator.js";

export const ROBOT_STATE_INPUT = "WAITING_FOR_INPUT"
export const ROBOT_STATE_COMMIT = "INPUT_ACCEPTED"
export const ROBOT_STATE_ACTION = "ACTION"
export const ROBOT_STATE_PREPARING = "PREPARING"
export const ROBOT_STATE_DESTROYED = "DISASSEMBLED"
export const ROBOT_STATE_WINNER = "WINNER"
export const ROBOT_HAND_RIGHT = "RIGHT"
export const ROBOT_HAND_LEFT = "LEFT"
export const ROBOT_SIDE_RIGHT = "ROBOT_RIGHT"
export const ROBOT_SIDE_LEFT = "ROBOT_LEFT"

export default class Robot {
    state = ROBOT_STATE_PREPARING

    actions = []
    handCards = []
    discardedCards = []

    constructor(side, robotOptions, randomGenerator, robotUpdateCallback) {
        if (side !== ROBOT_SIDE_RIGHT && side !== ROBOT_SIDE_LEFT) throw "Unknown side " + side
        this.side = side
        this._randomGenerator = randomGenerator
        this._robotUpdate = robotUpdateCallback

        robotOptions = {
            cards: {punch: 6, up1: 3, up2: 2, up3: 1, down1: 3, down2: 2, down3: 1, charge: 2},
            actionsCount: 3,
            drawnCardsCount: 5,
            maxTimeToInput: 5,
            inputOvertimeTorsoDamage: 1,
            headHealth: 40,
            torsoHealth: 80,
            heatsinkHealth: 60,
            rightHandPosition: 3,
            leftHandPosition: 5,
            ...robotOptions,
        }

        this.deckCards = this._shuffleCards(createDeckByTypes(robotOptions.cards))

        this.actionsCount = robotOptions.actionsCount
        this.drawnCardsCount = robotOptions.drawnCardsCount
        this.maxTimeToInput = robotOptions.maxTimeToInput
        this.timeToInput = this.maxTimeToInput
        this.inputOvertimeTorsoDamage = robotOptions.inputOvertimeTorsoDamage

        for (let i = 0; i < this.actionsCount; i++) {
            this.actions.push(new Action())
        }

        this.head = new Bodypart(robotOptions.headHealth)
        this.torso = new Bodypart(robotOptions.torsoHealth)
        this.heatsink = new Bodypart(robotOptions.heatsinkHealth)
        this.rightHand = new Hand(robotOptions.rightHandPosition, 1, 7)
        this.leftHand = new Hand(robotOptions.leftHandPosition, 1, 7)
    }

    copy(safe = false) {
        const copy = Object.assign(Object.create(Robot.prototype),{
            ...this,
            _randomGenerator: Object.create(RandomGenerator.prototype, Object.getOwnPropertyDescriptors(this._randomGenerator)),
            _robotUpdate: () => {},
            actions: this.actions.map(action => Object.create(Action.prototype, Object.getOwnPropertyDescriptors(action))),
            handCards: [...this.handCards],
            deckCards: [...this.deckCards],
            discardedCards: [...this.discardedCards],
            head: Object.create(Bodypart.prototype, Object.getOwnPropertyDescriptors(this.head)),
            torso: Object.create(Bodypart.prototype, Object.getOwnPropertyDescriptors(this.torso)),
            heatsink: Object.create(Bodypart.prototype, Object.getOwnPropertyDescriptors(this.heatsink)),
            rightHand: Object.create(Hand.prototype, Object.getOwnPropertyDescriptors(this.rightHand)),
            leftHand: Object.create(Hand.prototype, Object.getOwnPropertyDescriptors(this.leftHand)),
        })

        if (safe) {
            copy._randomGenerator = new RandomGenerator("copy")
            if (copy.state === ROBOT_STATE_INPUT) {
                copy.actions = copy.actions.map(() => new Action())
            }
            copy.deckCards = copy.deckCards.map(() => createBlankCard())
            copy.discardedCards = copy.discardedCards.map(() => createBlankCard())
        }

        return copy
    }

    get robotInfo() {
        return Object.freeze({
            side: this.side,
            state: this.state,
            head: this.head.info,
            torso: this.torso.info,
            heatsink: this.heatsink.info,
            rightHand: this.rightHand.info,
            leftHand: this.leftHand.info,
            timeToInput: this.timeToInput,
        })
    }

    get cardsInfo() {
        return Object.freeze({
            side: this.side,
            state: this.state,
            actions: Object.freeze(this.actions.map(action => action.info)),
            handCards: Object.freeze(this.handCards.map(card => card.info)),
            deckCardsCount: this.deckCards.length,
            discardedCardsCount: this.discardedCards.length,
        })
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
        console.debug("Creating NULL bodypart for position " + position)
        return new Bodypart(0)
    }

    getNeighboringBodyparts(bodypart) {
        switch (bodypart) {
            case this.head:
                return [this.torso]
            case this.torso:
                return [this.head, this.heatsink]
            case this.heatsink:
                return [this.torso]
        }
        throw "Unexpected bodypart"
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
        if (this.state !== ROBOT_STATE_PREPARING) throw "Robot can draw hand only during " + ROBOT_STATE_PREPARING

        this.timeToInput = this.maxTimeToInput

        this.actions.forEach(action => action.discard())
        this.discardedCards = this.discardedCards.concat(this.handCards)
        this.handCards = []
        for (let i = 0; i < this.drawnCardsCount; i++) {
            if (this.deckCards.length === 0) {
                if (this.discardedCards.length === 0) {
                    break
                }
                this.deckCards = this._shuffleCards(this.discardedCards)
                this.discardedCards = []
            }
            this.handCards.push(this.deckCards.shift())
        }

        this.state = ROBOT_STATE_INPUT

        this._robotUpdate()

        return this.handCards
    }

    chooseAction(handCardIndex, actionIndex) {
        if (this.state !== ROBOT_STATE_INPUT) throw "Robot can choose action only during " + ROBOT_STATE_INPUT

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
            this.actions[this.actions.map(action => action.card).indexOf(chosenCard)].discard()
        }

        this.actions[actionIndex].insertCard(chosenCard, handCardIndex)

        this._robotUpdate()
    }

    swapActions(firstActionIndex, secondActionIndex) {
        if (this.state !== ROBOT_STATE_INPUT) throw "Robot can swap actions only during " + ROBOT_STATE_INPUT

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

        this._robotUpdate()
    }

    toggleActionHand(actionIndex) {
        if (this.state !== ROBOT_STATE_INPUT) throw "Robot can choose action hand only during " + ROBOT_STATE_INPUT

        if (this.actions[actionIndex] === undefined) {
            console.debug('actions:', this.actions)
            throw "Undefined action index " + actionIndex
        }

        this.actions[actionIndex].toggleHand()

        this._robotUpdate()
    }

    discardAction(actionIndex) {
        if (this.state !== ROBOT_STATE_INPUT) throw "Robot can discard action only during " + ROBOT_STATE_INPUT

        this.actions[actionIndex].discard()

        this._robotUpdate()
    }

    commit() {
        if (this.state !== ROBOT_STATE_INPUT) throw "Robot can commit only during " + ROBOT_STATE_INPUT

        this.state = ROBOT_STATE_COMMIT
        this._robotUpdate()
    }

    tick() {
        if (this.state !== ROBOT_STATE_INPUT) return
        if (this.timeToInput === null) return

        if (this.timeToInput <= 0) {
            this.torso.health -= this.inputOvertimeTorsoDamage
            if (this.isDestroyed()) {
                this.state = ROBOT_STATE_DESTROYED
            }
        }
        this.timeToInput--

        this._robotUpdate()
    }

    _shuffleCards(cards) {
        return cards
            .map(card => ({card, sort: this._randomGenerator.nextRandom()}))
            .sort((a, b) => a.sort - b.sort)
            .map(({card}) => card)
    }
}