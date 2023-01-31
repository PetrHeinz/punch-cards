class Game {
    leftRobot
    rightRobot
    constructor() {
        this.leftRobot = new Robot(CARDS)
        this.rightRobot = new Robot(CARDS)
    }
}

class Robot {
    discardedCards = []
    handCards = []
    actions = []
    constructor(cards) {
        this.head = new Bodypart(40)
        this.torso = new Bodypart(80)
        this.heatsink = new Bodypart(60)
        this.rightHand = new Hand(3, 1, 7)
        this.leftHand = new Hand(5, 1, 7)
        this.deckCards = buildDeck(cards)
        this.drawHand()
    }
    getBodypartAt(position) {
        switch (position) {
            case 1:
            case 2:
                return this.head
            case 3:
            case 4:
            case 5:
                return this.torso
            case 6:
            case 7:
                return this.heatsink
        }
        throw "Unexpected position " + position
    }
    drawHand() {
        this.actions = [null, null, null]
        this.discardedCards = this.discardedCards.concat(this.handCards)
        this.handCards = []
        for (let i = 0; i < 5; i++) {
            if (this.deckCards.length === 0) {
                this.deckCards = shuffleCards(this.discardedCards)
                this.discardedCards = []
            }
            this.handCards.push(this.deckCards.shift())
        }
        return this.handCards
    }
    chooseAction(handCardIndex, actionIndex) {
        if (this.actions[actionIndex] === undefined) {
            console.debug('actions:', this.actions)
            throw "Undefined action index " + actionIndex
        }
        if (this.handCards[handCardIndex] === undefined) {
            console.debug(this.handCards)
            throw "Undefined hand card index " + handCardIndex
        }
        const chosenCard = this.handCards[handCardIndex]
        if (this.actions.indexOf(chosenCard) > -1) {
            console.debug("This card has already been chosen")
            this.actions[this.actions.indexOf(chosenCard)] = null
        }
        this.actions[actionIndex] = chosenCard
    }
    discardAction(actionIndex) {
        this.actions[actionIndex] = null
    }
}

class Bodypart {
    constructor(health) {
        this.health = health
    }
}

class Hand {
    constructor(position, min, max) {
        this._position = position
        this.min = min
        this.max = max
    }
    get position() {
        return this._position
    }
    set position(position) {
        this._position = Math.max(this.min, Math.min(position, this.max))
    }
}

function buildDeck(cards) {
    let deck = []
    cards.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({...card})
        }
    })

    return shuffleCards(deck)
}

function shuffleCards(cards) {
    return cards
        .map(card => ({ card, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ card }) => card)
}
