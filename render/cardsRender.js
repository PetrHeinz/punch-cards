import ChangeCache from "../utils/changeCache.js";
import {ROBOT_HAND_RIGHT, ROBOT_STATE_INPUT} from "../game/robot.js";

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

        const deckCards = document.createElement('div')
        deckCards.classList.add('cards-count', 'in-deck')
        deckCards.append("IN DECK")
        deckCards.append(document.createElement('br'))
        this.deckCardsCount = document.createElement('span')
        deckCards.append(this.deckCardsCount)
        root.append(deckCards)

        const discardedCards = document.createElement('div')
        discardedCards.classList.add('cards-count', 'discarded')
        discardedCards.append("DISCARDED")
        discardedCards.append(document.createElement('br'))
        this.discardedCardsCount = document.createElement('span')
        discardedCards.append(this.discardedCardsCount)
        root.append(discardedCards)

        this.readyButton = document.createElement('div')
        this.readyButton.classList.add('button')
        this.readyButton.textContent = 'Ready'
        root.append(this.readyButton)

        Object.freeze(this)
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
        const cardElement = CardsRender.createCard(card)
        if (used) {
            cardElement.classList.add("used")
        }
        root.append(cardElement)

        return cardElement
    }

    static createCard(card) {
        const cardElement = document.createElement('div')
        cardElement.classList.add('card')

        const iconElement = document.createElement('div')
        iconElement.classList.add("icon")
        const emojiCount = card.icon.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu).length
        iconElement.style.setProperty("--fontsize-multiplier", 1.65 / emojiCount + 0.35)
        iconElement.append(card.icon)

        cardElement.append(iconElement)
        cardElement.append(card.name)

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

        this.deckCardsCount.textContent = cardsInfo.deckCardsCount
        this.discardedCardsCount.textContent = cardsInfo.discardedCardsCount

        this.readyButton.classList.toggle("pushed", cardsInfo.state !== ROBOT_STATE_INPUT)
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