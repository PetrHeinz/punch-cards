import CardsRender from "./cardsRender.js";
import {ROBOT_STATE_INPUT} from "../game/robot.js";

const ROBOT_CARDS_ACTION = "ACTION"
const ROBOT_CARDS_HAND = "HAND"

const MOVEMENT_TOLERANCE = 5

export default class ControllableCardsRender extends CardsRender {
    vars = {
        root: document.body,
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
        this.vars.root = root

        document.addEventListener("mousedown", (event) => {
            if (event.button !== 0) return
            if (!this.vars.isInInputState) return
            this._dragStart(event.target, event.clientX, event.clientY)
                && event.preventDefault()
        }, {passive: false})
        document.addEventListener("touchstart", (event) => {
            if (!this.vars.isInInputState) return
            this._dragStart(event.target, event.touches[0].clientX, event.touches[0].clientY)
                && event.preventDefault()
        }, {passive: false})
        document.addEventListener("mousemove", (event) => {
            this._dragMove(event.clientX, event.clientY)
                && event.preventDefault()
        }, {passive: false})
        document.addEventListener("touchmove", (event) => {
            this._dragMove(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
                && event.preventDefault()
        }, {passive: false})
        document.addEventListener("mouseup", (event) => {
            this._dragStop(event.target)
                && event.preventDefault()
        }, {passive: false})
        document.addEventListener("touchend", (event) => {
            const target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            this._dragStop(target)
                && event.preventDefault()
        }, {passive: false})

        this.readyButton.addEventListener("click", () => {
            if (!this.vars.isInInputState) return
            this.robotControl.commit()
        })
    }

    _dragStart(target, x, y) {
        const draggedElement = document.createElement("div")
        console.log("dragstart", draggedElement)
        const actionCardIndex = getChildIndex(this.actionCards, target)
        if (actionCardIndex !== null) {
            draggedElement.append(this.actionCards.children[actionCardIndex].cloneNode(true))
            draggedElement.dataset.selected = ROBOT_CARDS_ACTION
            draggedElement.dataset.selectedIndex = actionCardIndex
            draggedElement.querySelector(".hand-toggle")?.remove()
        }
        const handCardIndex = getChildIndex(this.handCards, target)
        if (handCardIndex !== null) {
            draggedElement.append(this.handCards.children[handCardIndex].cloneNode(true))
            draggedElement.dataset.selected = ROBOT_CARDS_HAND
            draggedElement.dataset.selectedIndex = handCardIndex
        }
        if (draggedElement.children.length === 0) return false

        if (this.vars.draggedElement !== null) {
            this.vars.draggedElement.remove()
        }
        this.vars.draggedElement = draggedElement

        this.vars.draggedMovement = 0
        draggedElement.style.position = "fixed"
        draggedElement.style.pointerEvents = "none"

        draggedElement.style.zIndex = "100"
        draggedElement.style.transform = `translate(-50%, -50%)`
        draggedElement.style.left = `${x}px`
        draggedElement.style.top = `${y}px`

        return true
    }

    _dragMove(x, y) {
        const draggedElement = this.vars.draggedElement
        if (draggedElement === null) return false

        this.vars.draggedMovement += Math.abs(x - parseInt(draggedElement.style.left))
        this.vars.draggedMovement += Math.abs(y - parseInt(draggedElement.style.top))

        draggedElement.style.left = `${x}px`
        draggedElement.style.top = `${y}px`

        if (this.vars.draggedMovement > MOVEMENT_TOLERANCE && draggedElement.parentElement === null) {
            root.append(draggedElement)
        }

        return true
    }

    _dragStop(target) {
        const draggedElement = this.vars.draggedElement
        if (draggedElement === null) return false

        draggedElement.remove()
        this.vars.draggedElement = null

        const actionCardIndex = getChildIndex(this.actionCards, target)
        if (draggedElement.dataset.selected === ROBOT_CARDS_HAND) {
            if (actionCardIndex !== null) {
                this.robotControl.chooseAction(draggedElement.dataset.selectedIndex, actionCardIndex)
                return true
            }
        }
        if (draggedElement.dataset.selected === ROBOT_CARDS_ACTION) {
            if (actionCardIndex === null) {
                this.robotControl.discardAction(draggedElement.dataset.selectedIndex)
                return true
            }
            if (`${actionCardIndex}` === draggedElement.dataset.selectedIndex) {
                this.robotControl.toggleActionHand(actionCardIndex)
                return true
            }
            this.robotControl.swapActions(draggedElement.dataset.selectedIndex, actionCardIndex)
            return true
        }

        return false
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