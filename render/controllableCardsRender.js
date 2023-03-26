import CardsRender from "./cardsRender.js";
import {ROBOT_STATE_INPUT} from "../game/robot.js";

const ROBOT_CARDS_ACTION = "ACTION"
const ROBOT_CARDS_HAND = "HAND"

const MOVEMENT_TOLERANCE = 5

export default class ControllableCardsRender extends CardsRender {
    vars = {
        draggedElement: null,
        draggedMovement: 0,
        isInInputState: false,
    }

    constructor(robotControl) {
        super();
        this.robotControl = robotControl
    }

    initialize(root) {
        super.initialize(root);

        document.addEventListener("mousedown", (event) => {
            if (event.button !== 0) return
            if (!this.vars.isInInputState) return

            const draggedElement = document.createElement("div")
            const actionCardIndex = getChildIndex(this.actionCards, event.target)
            if (actionCardIndex !== null) {
                draggedElement.append(this.actionCards.children[actionCardIndex].cloneNode(true))
                draggedElement.dataset.selected = ROBOT_CARDS_ACTION
                draggedElement.dataset.selectedIndex = actionCardIndex
                draggedElement.querySelector(".hand-toggle")?.remove()
            }
            const handCardIndex = getChildIndex(this.handCards, event.target)
            if (handCardIndex !== null) {
                draggedElement.append(this.handCards.children[handCardIndex].cloneNode(true))
                draggedElement.dataset.selected = ROBOT_CARDS_HAND
                draggedElement.dataset.selectedIndex = handCardIndex
            }
            if (draggedElement.children.length === 0) return

            if (this.vars.draggedElement !== null) {
                this.vars.draggedElement.remove()
            }
            this.vars.draggedElement = draggedElement
            this.vars.draggedMovement = 0

            draggedElement.style.position = "fixed"
            draggedElement.style.pointerEvents = "none"
            draggedElement.style.zIndex = "100"

            draggedElement.style.transform = `translate(-50%, -50%)`
            draggedElement.style.left = `${event.clientX}px`
            draggedElement.style.top = `${event.clientY}px`
        })
        document.addEventListener("mousemove", (event) => {
            const draggedElement = this.vars.draggedElement
            if (draggedElement === null) return

            this.vars.draggedMovement += Math.abs(event.movementX) + Math.abs(event.movementY)

            draggedElement.style.left = `${event.clientX}px`
            draggedElement.style.top = `${event.clientY}px`

            if (this.vars.draggedMovement > MOVEMENT_TOLERANCE && draggedElement.parentElement === null) {
                root.append(draggedElement)
            }
        })
        document.addEventListener("mouseup", (event) => {
            const draggedElement = this.vars.draggedElement
            if (draggedElement === null) return

            draggedElement.remove()
            this.vars.draggedElement = null

            const actionCardIndex = getChildIndex(this.actionCards, event.target)
            if (draggedElement.dataset.selected === ROBOT_CARDS_HAND) {
                if (actionCardIndex !== null) {
                    this.robotControl.chooseAction(draggedElement.dataset.selectedIndex, actionCardIndex)
                    return
                }
            }
            if (draggedElement.dataset.selected === ROBOT_CARDS_ACTION) {
                if (actionCardIndex === null) {
                    this.robotControl.discardAction(draggedElement.dataset.selectedIndex)
                    return
                }
                if (`${actionCardIndex}` === draggedElement.dataset.selectedIndex) {
                    this.robotControl.toggleActionHand(actionCardIndex)
                    return
                }
                this.robotControl.swapActions(draggedElement.dataset.selectedIndex, actionCardIndex)
            }
        })

        this.readyButton.addEventListener("click", () => {
            if (!this.vars.isInInputState) return
            this.robotControl.commit()
        })
    }

    initAction(root, action) {
        return super.initAction(root, action)
    }

    render(cardsInfo) {
        super.render(cardsInfo)

        this.vars.isInInputState = cardsInfo.state === ROBOT_STATE_INPUT
        Array.from(this.actionCards.children).concat(this.handCards).forEach((actionCard) => {
            actionCard.style.cursor = this.vars.isInInputState ? "grab" : ""
            const handToggle = actionCard.querySelector(".hand-toggle");
            if (handToggle !== null) {
                handToggle.classList.toggle("clickable", this.vars.isInInputState)
            }
        })
        this.readyButton.classList.toggle("clickable", this.vars.isInInputState)
    }
}

function getChildIndex(element, childElement) {
    for (const childIndex in element.children) {
        if (element.children[childIndex] === childElement) {
            return parseInt(childIndex)
        }
    }
    if (childElement.parentElement === null) {
        return null
    }
    return getChildIndex(element, childElement.parentElement)
}