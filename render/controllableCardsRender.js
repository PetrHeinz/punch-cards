import CardsRender from "./cardsRender.js";
import {ROBOT_STATE_INPUT} from "../game/robot.js";

const ROBOT_CARDS_ACTION = "ACTION"
const ROBOT_CARDS_HAND = "HAND"
const ROBOT_CARDS_NONE = "NONE"


export default class ControllableCardsRender extends CardsRender {
    vars = {
        selected: ROBOT_CARDS_NONE,
        selectedIndex: 0,
        isInInputState: false,
    }

    constructor(robotControl) {
        super();
        this.robotControl = robotControl
    }

    initialize(root) {
        super.initialize(root);

        this.actionCards.addEventListener("click", (event) => {
            if (!this.vars.isInInputState) return
            if (event.target === this.actionCards) return

            const actionCardIndex = getChildIndex(this.actionCards, event.target)
            if (event.target.classList.contains("hand-toggle")) {
                this.robotControl.toggleActionHand(actionCardIndex)
                return
            }

            if (this.vars.selected === ROBOT_CARDS_HAND) {
                this.robotControl.chooseAction(this.vars.selectedIndex, actionCardIndex)
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.vars.selected === ROBOT_CARDS_ACTION) {
                if (actionCardIndex !== this.vars.selectedIndex) {
                    this.robotControl.swapActions(actionCardIndex, this.vars.selectedIndex)
                }
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            this._selectCard(ROBOT_CARDS_ACTION, actionCardIndex)
        })

        this.handCards.addEventListener("click", (event) => {
            if (!this.vars.isInInputState) return
            if (event.target === this.handCards) return

            const handCardIndex = getChildIndex(this.handCards, event.target)
            if (this.vars.selected === ROBOT_CARDS_ACTION) {
                if (this.actionCards.children[this.vars.selectedIndex].dataset.handCardIndex === handCardIndex) {
                    this.robotControl.discardAction(this.vars.selectedIndex)
                } else {
                    this.robotControl.chooseAction(handCardIndex, this.vars.selectedIndex)
                }
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.vars.selected === ROBOT_CARDS_HAND && handCardIndex === this.vars.selectedIndex) {
                this._selectCard(ROBOT_CARDS_NONE)
                return
            }
            this._selectCard(ROBOT_CARDS_HAND, handCardIndex)
        })

        this.readyButton.addEventListener("click", () => {
            if (!this.vars.isInInputState) return
            this.robotControl.commit()
            this._selectCard(ROBOT_CARDS_NONE)
        })
    }

    initAction(root, action) {
        return super.initAction(root, action)
    }

    render(cardsInfo) {
        super.render(cardsInfo)

        this.vars.isInInputState = cardsInfo.state === ROBOT_STATE_INPUT
        this.actionCards.classList.toggle("clickable", this.vars.isInInputState)
        this.handCards.classList.toggle("clickable", this.vars.isInInputState)
        this.readyButton.classList.toggle("clickable", this.vars.isInInputState)
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
        this.vars.selected = selected
        if (selectedIndex !== undefined) {
            this.vars.selectedIndex = selectedIndex
        }
    }
}

function getChildIndex(element, childElement) {
    for (const childIndex in element.children) {
        if (element.children[childIndex] === childElement) {
            return parseInt(childIndex)
        }
    }
    return getChildIndex(element, childElement.parentElement)
}