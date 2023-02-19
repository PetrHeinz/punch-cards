import CardsRender from "./cardsRender.js";
import {ROBOT_STATE_CONTROL} from "../game/robot.js";

const ROBOT_CARDS_ACTION = "ACTION"
const ROBOT_CARDS_HAND = "HAND"
const ROBOT_CARDS_NONE = "NONE"


export default class ControllableCardsRender extends CardsRender {
    selected = ROBOT_CARDS_NONE
    selectedIndex = 0

    constructor(robotControl) {
        super();
        this.robotControl = robotControl
    }

    initialize(root) {
        super.initialize(root);

        this.actionCards.addEventListener("click", (event) => {
            if (this.cardsInfo.state !== ROBOT_STATE_CONTROL) return
            if (event.target === this.actionCards) return

            const actionCardIndex = getChildIndex(this.actionCards, event.target)
            if (event.target.classList.contains("hand-toggle")) {
                this.robotControl.toggleActionHand(actionCardIndex)
                return
            }

            if (this.selected === ROBOT_CARDS_HAND) {
                this.robotControl.chooseAction(this.selectedIndex, actionCardIndex)
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (actionCardIndex !== this.selectedIndex) {
                    this.robotControl.swapActions(actionCardIndex, this.selectedIndex)
                }
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            this._selectCard(ROBOT_CARDS_ACTION, actionCardIndex)
        })

        this.handCards.addEventListener("click", (event) => {
            if (this.cardsInfo.state !== ROBOT_STATE_CONTROL) return
            if (event.target === this.handCards) return

            const handCardIndex = getChildIndex(this.handCards, event.target)
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (this.actionCards.children[this.selectedIndex].dataset.handCardIndex === handCardIndex) {
                    this.robotControl.discardAction(this.selectedIndex)
                } else {
                    this.robotControl.chooseAction(handCardIndex, this.selectedIndex)
                }
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_HAND && handCardIndex === this.selectedIndex) {
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            this._selectCard(ROBOT_CARDS_HAND, handCardIndex)
        })

        this.readyButton.addEventListener("click", () => {
            if (this.cardsInfo.state !== ROBOT_STATE_CONTROL) return
            this.robotControl.commit()
            this._selectCard(ROBOT_CARDS_NONE)
        })
    }

    initAction(root, action) {
        return super.initAction(root, action)
    }

    initCard(root, card, used = false) {
        return super.initCard(root, card)
    }

    render(cardsInfo) {
        this.cardsInfo = cardsInfo

        super.render(cardsInfo)

        this.actionCards.style.cursor = this.cardsInfo.state === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.handCards.style.cursor = this.cardsInfo.state === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.readyButton.classList.toggle("clickable", this.cardsInfo.state === ROBOT_STATE_CONTROL)
    }

    _selectCard(selected, selectedIndex) {
        this.actionCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        this.handCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        if (selected === ROBOT_CARDS_ACTION) {
            this.actionCards.children[selectedIndex].classList.add("selected")
        }
        if (selected === ROBOT_CARDS_HAND) {
            this.handCards.children[selectedIndex].classList.add("selected")
        }
        this.selected = selected
        if (selectedIndex !== undefined) {
            this.selectedIndex = selectedIndex
        }
    }
}

function getChildIndex(element, childElement) {
    for (const childIndex in element.children) {
        if (element.children[childIndex] === childElement) {
            return childIndex
        }
    }
    return getChildIndex(element, childElement.parentElement)
}