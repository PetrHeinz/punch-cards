import ChangeCache from "../utils/changeCache.js";
import {ROBOT_HAND_RIGHT, ROBOT_STATE_CONTROL} from "../game/robot.js";

export default class RobotRender {
    constructor(root, extraClass, controller) {
        this.controller = controller

        this._actionCardsCache = new ChangeCache()
        this._handCardsCache = new ChangeCache()

        const side = document.createElement('div')
        side.classList.add('side')
        side.classList.add(extraClass)

        const robot = document.createElement('div')
        robot.classList.add('robot')

        this.head = this.initBodypart(robot, 'head')
        this.torso = this.initBodypart(robot, 'torso')
        this.heatsink = this.initBodypart(robot, 'heatsink')
        this.rightHand = this.initHand(robot, 'right')
        this.leftHand = this.initHand(robot, 'left')

        this.state = document.createElement('div')
        this.state.classList.add('state')
        robot.append(this.state)

        side.append(robot)

        this.actionCards = document.createElement('div')
        this.actionCards.classList.add('actions')
        side.append(this.actionCards)

        this.handCards = document.createElement('div')
        this.handCards.classList.add('cards')
        side.append(this.handCards)

        this.readyButton = document.createElement('div')
        this.readyButton.classList.add('button')
        this.readyButton.textContent = 'Ready'
        side.append(this.readyButton)

        root.append(side)

        this.controller.initialize(this)
    }

    initBodypart(root, extraClass) {
        const bodypart = document.createElement('div')
        bodypart.classList.add('bodypart')
        bodypart.classList.add(extraClass)

        root.append(bodypart)

        return bodypart
    }

    initHand(root, extraClass) {
        const bodypart = document.createElement('div')
        bodypart.classList.add('bodypart')
        bodypart.classList.add('hand')
        bodypart.classList.add(extraClass)

        root.append(bodypart)

        return bodypart
    }

    initAction(root, action) {
        const cardElement = this.initCard(root, action.card)
        const handElement = document.createElement("div")
        handElement.classList.add("hand-toggle")
        handElement.classList.add(action.hand === ROBOT_HAND_RIGHT ? "right" : "left")
        handElement.textContent = action.hand
        cardElement.append(handElement)
        cardElement.dataset.handCardIndex = action.handCardIndex
    }

    initCard(root, card) {
        const cardElement = document.createElement('div')
        cardElement.classList.add('card')

        if (card !== null) {
            cardElement.append(card.icon)
            cardElement.append(document.createElement('br'))
            cardElement.append(card.name)
        }

        root.append(cardElement)

        return cardElement
    }

    renderCardsInfo(cardsInfo) {
        this._actionCardsCache.ifChanged(cardsInfo.actions, () => {
            this.actionCards.innerHTML = ''
            cardsInfo.actions.forEach((action) => this.initAction(this.actionCards, action))
        })
        this._handCardsCache.ifChanged(cardsInfo.handCards, () => {
            this.handCards.innerHTML = ''
            cardsInfo.handCards.forEach((card) => this.initCard(this.handCards, card))
        })

        this.controller.afterRender()
    }

    renderRobotInfo(robotInfo) {
        this.robot = robotInfo

        this.state.textContent = robotInfo.state
        this.head.textContent = robotInfo.head.health
        this.torso.textContent = robotInfo.torso.health
        this.heatsink.textContent = robotInfo.heatsink.health
        this.rightHand.style = '--up: ' + (8 - robotInfo.rightHand.position)
        this.rightHand.classList.toggle('blocking', robotInfo.rightHand.isBlocking)
        this.rightHand.classList.toggle('attacking', robotInfo.rightHand.isAttacking)
        this.rightHand.classList.toggle('blocked', robotInfo.rightHand.isBlocked)
        this.rightHand.classList.toggle('charged', robotInfo.rightHand.isCharged)
        this.leftHand.style = '--up: ' + (8 - robotInfo.leftHand.position)
        this.leftHand.classList.toggle('blocking', robotInfo.leftHand.isBlocking)
        this.leftHand.classList.toggle('attacking', robotInfo.leftHand.isAttacking)
        this.leftHand.classList.toggle('blocked', robotInfo.leftHand.isBlocked)
        this.leftHand.classList.toggle('charged', robotInfo.leftHand.isCharged)

        this.readyButton.classList.toggle("pushed", robotInfo.state !== ROBOT_STATE_CONTROL)

        this.controller.afterRender()
    }
}