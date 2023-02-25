import ChangeCache from "../utils/changeCache.js";
import {ROBOT_HAND_RIGHT, ROBOT_STATE_CONTROL} from "../game/robot.js";

export default class CardsRender {
    initialize(root) {
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
    }

    initAction(root, action) {
        const cardElement = this.initCard(root, action.card)
        cardElement.dataset.handCardIndex = action.handCardIndex

        const handElement = document.createElement("div")
        handElement.classList.add("hand-toggle")
        handElement.classList.add(action.hand === ROBOT_HAND_RIGHT ? "right" : "left")

        handElement.textContent = action.hand

        cardElement.append(handElement)

        return cardElement
    }

    initCard(root, card, used = false) {
        const cardElement = document.createElement('div')
        cardElement.classList.add('card')
        if (used) {
            cardElement.classList.add("used")
        }

        const iconElement = document.createElement('div')
        iconElement.classList.add("icon")
        iconElement.style.setProperty("--fontsize-multiplier", 2 / Math.pow(card.icon.length, 0.4))
        iconElement.append(card.icon)

        cardElement.append(iconElement)
        cardElement.append(card.name)

        root.append(cardElement)

        return cardElement
    }

    render(cardsInfo) {
        cardsInfo = this._enrichHandCardsInfo(cardsInfo);

        this._actionCardsCache.ifChanged(cardsInfo.actions, () => {
            this.actionCards.innerHTML = ''
            cardsInfo.actions.forEach(action => {
                this.initAction(this.actionCards, action)
            })
        })

        this._handCardsCache.ifChanged(cardsInfo.handCards, () => {
            this.handCards.innerHTML = ''
            cardsInfo.handCards.forEach((handCard) => {
                this.initCard(this.handCards, handCard,handCard.used)
            })
        })

        this.readyButton.classList.toggle("pushed", cardsInfo.state !== ROBOT_STATE_CONTROL)
    }

    _enrichHandCardsInfo(cardsInfo) {
        const usedHandCardIndexes = cardsInfo.actions.map(action => action.handCardIndex);

        cardsInfo.handCards = cardsInfo.handCards.map((handCard, handCardIndex) => ({
            ...handCard,
            used: usedHandCardIndexes.indexOf(handCardIndex) > -1
        }))

        return cardsInfo
    }
}