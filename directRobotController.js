import {ROBOT_STATE_CONTROL} from "./game.js";

const ROBOT_CARDS_ACTION = "ACTION"
const ROBOT_CARDS_HAND = "HAND"
const ROBOT_CARDS_NONE = "NONE"

export default class DirectRobotController {
    selected = ROBOT_CARDS_NONE
    selectedIndex = 0

    /**
     * @param {Robot} robot
     */
    constructor(robot) {
        this.robot = robot
    }

    /**
     * @param {RobotRender} robotRender
     */
    initialize(robotRender) {
        if (this.render !== undefined) throw "This controller has already been initialized"
        this.render = robotRender

        this.render.actionCards.addEventListener("click", (event) => {
            if (this.robot.state !== ROBOT_STATE_CONTROL) return
            if (event.target === this.render.actionCards) return

            const actionCardIndex = getChildIndex(this.render.actionCards, event.target)
            if (event.target.classList.contains("hand-toggle")) {
                this.robot.toggleActionHand(actionCardIndex)
                return
            }

            if (this.selected === ROBOT_CARDS_HAND) {
                this.robot.chooseAction(this.selectedIndex, actionCardIndex)
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (actionCardIndex !== this.selectedIndex) {
                    this.robot.swapActions(actionCardIndex, this.selectedIndex)
                }
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_ACTION, actionCardIndex)
        })

        this.render.handCards.addEventListener("click", (event) => {
            if (this.robot.state !== ROBOT_STATE_CONTROL) return
            if (event.target === this.render.handCards) return

            const handCardIndex = getChildIndex(this.render.handCards, event.target)
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (this.robot.actions[this.selectedIndex].card === this.robot.handCards[handCardIndex]) {
                    this.robot.discardAction(this.selectedIndex)
                } else {
                    this.robot.chooseAction(handCardIndex, this.selectedIndex)
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
            if (this.robot.state !== ROBOT_STATE_CONTROL) return
            this.robot.commit()
            this.selectCard(ROBOT_CARDS_NONE)
        })
    }

    afterRender() {
        this.selectCard(this.selected, this.selectedIndex)

        for (const handCardIndex in this.robot.handCards) {
            const handCardUsed = this.robot.actions.indexOf(this.robot.handCards[handCardIndex]) >= 0
            this.render.handCards.children[handCardIndex].classList.toggle("used", handCardUsed)
        }

        this.render.actionCards.style.cursor = this.robot.state === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.render.handCards.style.cursor = this.robot.state === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.render.readyButton.classList.toggle("clickable", this.robot.state === ROBOT_STATE_CONTROL)
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