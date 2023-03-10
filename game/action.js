import {createBlankCard} from "./cards.js";
import {ROBOT_HAND_LEFT, ROBOT_HAND_RIGHT} from "./robot.js";

export default class Action {
    /** @type {Card} */
    _card = createBlankCard()
    _hand = ROBOT_HAND_RIGHT

    get info() {
        return Object.freeze({
            card: this.card.info,
            hand: this._hand,
            handCardIndex: this._handCardIndex
        })
    }

    get card() {
        return this._card
    }

    insertCard(card, handCardIndex) {
        this._card = card
        this._handCardIndex = handCardIndex
    }

    toggleHand() {
        this._hand = this._hand === ROBOT_HAND_RIGHT ? ROBOT_HAND_LEFT : ROBOT_HAND_RIGHT
    }

    discard() {
        this._card = createBlankCard()
        this._handCardIndex = undefined
    }

    getAction(thisRobot, otherRobot) {
        return this.card.getAction(thisRobot.getHand(this._hand), thisRobot, otherRobot)
    }
}