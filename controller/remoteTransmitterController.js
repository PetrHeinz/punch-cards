import {ROBOT_STATE_CONTROL} from "../game/robot.js";

const ROBOT_CARDS_ACTION = "ACTION"
const ROBOT_CARDS_HAND = "HAND"
const ROBOT_CARDS_NONE = "NONE"

// TODO: resolve DRY violation - DirectRobotController
export default class RemoteTransmitterController {
    selected = ROBOT_CARDS_NONE
    selectedIndex = 0

    constructor(sendActionCallback) {
        this.sendAction = (robotRender, data) => {
            data.robotId = robotRender.robot.id
            sendActionCallback(data)
        }
    }

    /**
     * @param {RobotRender} robotRender
     */
    initialize(robotRender) {
        if (this.render !== undefined) throw "This controller has already been initialized"
        this.render = robotRender

        this.render.actionCards.addEventListener("click", (event) => {
            if (this.render.state.textContent !== ROBOT_STATE_CONTROL) return
            if (event.target === this.render.actionCards) return

            const actionCardIndex = getChildIndex(this.render.actionCards, event.target)
            if (event.target.classList.contains("hand-toggle")) {
                this.sendAction(robotRender, {action: "toggleActionHand", actionIndex: actionCardIndex})
                return
            }

            if (this.selected === ROBOT_CARDS_HAND) {
                this.sendAction(robotRender, {action: "chooseAction", handCardIndex: this.selectedIndex, actionIndex: actionCardIndex})
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (actionCardIndex !== this.selectedIndex) {
                    this.sendAction(robotRender, {action: "swapActions", firstActionIndex: actionCardIndex, secondActionIndex: this.selectedIndex})
                }
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_ACTION, actionCardIndex)
        })

        this.render.handCards.addEventListener("click", (event) => {
            if (this.render.state.textContent !== ROBOT_STATE_CONTROL) return
            if (event.target === this.render.handCards) return

            const handCardIndex = getChildIndex(this.render.handCards, event.target)
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (this.render.actionCards.children[this.selectedIndex].dataset.handCardIndex === handCardIndex) {
                    this.sendAction(robotRender, {action: "discardAction", actionIndex: this.selectedIndex})
                } else {
                    this.sendAction(robotRender, {action: "chooseAction", handCardIndex: handCardIndex, actionIndex: this.selectedIndex})
                }
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_HAND && handCardIndex === this.selectedIndex) {
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_HAND, handCardIndex)
        })

        this.render.readyButton.addEventListener("click", () => {
            if (this.render.state.textContent !== ROBOT_STATE_CONTROL) return
            this.sendAction(robotRender, {action: "commit"})
            this.selectCard(ROBOT_CARDS_NONE)
        })
    }

    afterRender() {
        this.selectCard(this.selected, this.selectedIndex)

        const usedHandCardIndexes = []
        for (const actionCard of this.render.actionCards.children) {
            usedHandCardIndexes.push(actionCard.dataset.handCardIndex)
        }
        for (const handCardIndex in this.render.handCards.children) {
            if (handCardIndex.length > 1) continue // TODO: remove hack for properties like "length"
            const handCardUsed = usedHandCardIndexes.indexOf(handCardIndex) >= 0
            this.render.handCards.children[handCardIndex].classList.toggle("used", handCardUsed)
        }

        this.render.actionCards.style.cursor = this.render.state.textContent === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.render.handCards.style.cursor = this.render.state.textContent === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.render.readyButton.classList.toggle("clickable", this.render.state.textContent === ROBOT_STATE_CONTROL)
    }

    selectCard(selected, selectedIndex) {
        this.render.actionCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        this.render.handCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        if (selected === ROBOT_CARDS_ACTION) {
            this.render.actionCards.children[selectedIndex].classList.add("selected")
        }
        if (selected === ROBOT_CARDS_HAND) {
            this.render.handCards.children[selectedIndex].classList.add("selected")
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