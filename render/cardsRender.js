import ChangeCache from "../utils/changeCache.js";
import {ROBOT_HAND_RIGHT, ROBOT_STATE_CONTROL} from "../game/robot.js";

export default class CardsRender {
    constructor(root, controller) {
        this.controller = controller

        this._actionCardsCache = new ChangeCache()
        this._handCardsCache = new ChangeCache()

        this.actionCards = document.createElement('div')
        this.actionCards.classList.add('actions')
        root.append(this.actionCards)

        this.handCards = document.createElement('div')
        this.handCards.classList.add('cards')
        root.append(this.handCards)

        this.readyButton = document.createElement('div')
        this.readyButton.classList.add('button')
        this.readyButton.textContent = 'Ready'
        root.append(this.readyButton)

        this.controller.initialize(this)
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

    render(cardsInfo) {
        this.cardsInfo = cardsInfo

        this._actionCardsCache.ifChanged(cardsInfo.actions, () => {
            this.actionCards.innerHTML = ''
            cardsInfo.actions.forEach((action) => this.initAction(this.actionCards, action))
        })
        this._handCardsCache.ifChanged(cardsInfo.handCards, () => {
            this.handCards.innerHTML = ''
            cardsInfo.handCards.forEach((card) => this.initCard(this.handCards, card))
        })

        this.readyButton.classList.toggle("pushed", cardsInfo.state !== ROBOT_STATE_CONTROL)

        this.controller.afterRender()
    }
}