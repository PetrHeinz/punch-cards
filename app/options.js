import {appendButton, appendInput, appendLine, clear} from "./documentEdit.js";
import {createCardByType, getAllTypes} from "../game/cards.js";
import {RANDOM_CARD} from "../game/robot.js";

export default class Options {
    randomSeedString = "punch-cards"
    actionsCount = 3
    cardsCount = 5
    maxTimeToInput = 5
    tickInterval = 1000
    deckCards = {up2: 2, up3: 1, down2: 2, down3: 1, hand_flip: 1, punch: 2, up_flip: 1, down_flip: 1, flip_punch: 1, charge: 2, push_up: 2, push_down: 2, repair: 2, reinforce: 1}
    cards = ["punch", "up1", "down1"]


    /**
     * @param {Element} root
     * @param {function():void} backToMainMenu
     */
    constructor(root, backToMainMenu) {
        this.root = root
        this.backToMainMenu = backToMainMenu
    }

    get gameOptions() {
        const gameOptions = {
            robotOptions: {
                deckCards: this.deckCards,
                actionsCount: this.actionsCount,
                cards: Array.from(new Array(this.cardsCount), (_, i) => this.cards[i] ?? RANDOM_CARD),
                maxTimeToInput: this.maxTimeToInput,
            }
        }
        if (this.randomSeedString !== null) {
            gameOptions.randomSeedString = this.randomSeedString
        }

        return gameOptions
    }

    appendOptionsToMainMenu(menu) {
        const randomSeedStringInput = appendInput(menu, "Random seed string", this.randomSeedString)
        randomSeedStringInput.style.width = "16em"
        randomSeedStringInput.addEventListener("input", () => {
            const randomSeedString = randomSeedStringInput.value.trim()
            this.randomSeedString = randomSeedString !== "" ? randomSeedString : null
        })

        const actionsCountInput = appendInput(menu, "Number of possible actions", this.actionsCount)
        actionsCountInput.style.width = "4em"
        actionsCountInput.type = "number"
        actionsCountInput.addEventListener("input", () => {
            this.actionsCount = parseInt(actionsCountInput.value.trim())
        })

        const cardsCountInput = appendInput(menu, "Number of cards to choose from each turn", this.cardsCount)
        cardsCountInput.style.width = "4em"
        cardsCountInput.type = "number"
        cardsCountInput.addEventListener("input", () => {
            this.cardsCount = parseInt(cardsCountInput.value.trim())
        })

        const maxTimeToInputInput = appendInput(menu, "Time limit for card input (in ticks)", this.maxTimeToInput)
        maxTimeToInputInput.style.width = "4em"
        maxTimeToInputInput.type = "number"
        maxTimeToInputInput.addEventListener("input", () => {
            const maxTimeToInput = maxTimeToInputInput.value.trim()
            this.maxTimeToInput = maxTimeToInput !== "" ? parseInt(maxTimeToInput) : null
        })

        const tickIntervalInput = appendInput(menu, "Tick interval (in ms)", this.tickInterval)
        tickIntervalInput.style.width = "4em"
        tickIntervalInput.type = "number"
        tickIntervalInput.addEventListener("input", () => {
            this.tickInterval = parseInt(tickIntervalInput.value.trim())
        })
    }

    showCardsMenu() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')
        menu.style.display = "flex"

        const cardsMenu = document.createElement('div')
        cardsMenu.style.flex = 1
        cardsMenu.style.position = "relative"
        appendLine(cardsMenu, " ")
        appendLine(cardsMenu, "THE CARDS").style.fontWeight = "bold"
        for (let i = 0; i < this.cardsCount; i++) {
            const line = document.createElement('div')
            line.classList.add("line")
            const cardSelect = document.createElement("select")
            cardSelect.classList.add("input")
            cardSelect.style.color = "inherit"
            cardSelect.style.cursor = "pointer"
            cardSelect.style.fontWeight = "normal"
            const randomOption = document.createElement("option")
            randomOption.value = RANDOM_CARD
            randomOption.textContent = "Random (the deck) 🎲"
            cardSelect.append(randomOption)
            for (let cardType of getAllTypes()) {
                const card = createCardByType(cardType)
                const cardOption = document.createElement("option")
                cardOption.value = cardType
                cardOption.textContent = card.name + " " + card.icon
                cardOption.selected = cardType === this.cards[i]
                cardSelect.append(cardOption)
            }
            cardSelect.addEventListener("change", () => {
                this.cards[i] = cardSelect.value
            })
            line.append(cardSelect)
            cardsMenu.append(line)
        }
        appendButton(cardsMenu, "Save", () => this.backToMainMenu())
        menu.append(cardsMenu)

        const deckMenu = document.createElement('div')
        deckMenu.style.flex = 1
        appendLine(deckMenu, " ")
        appendLine(deckMenu, "THE DECK").style.fontWeight = "bold"
        for (const cardType of getAllTypes()) {
            const cardSettings = document.createElement('div')
            const card = createCardByType(cardType)

            cardSettings.classList.add("line")
            const cardCountInput = document.createElement("input")
            cardCountInput.classList.add("input")
            cardCountInput.min = 0
            cardCountInput.value = this.deckCards[cardType] ?? 0
            cardCountInput.style.width = "2em"
            cardCountInput.type = "number"
            cardCountInput.style.textAlign = "right"
            cardCountInput.addEventListener("input", () => {
                this.deckCards[cardType] = parseInt(cardCountInput.value.trim())
            })

            const cardElement = document.createElement('span')
            cardElement.append(cardCountInput)
            cardElement.append(card.name)
            cardElement.title = card.description

            const iconElement = document.createElement('span')
            iconElement.textContent = card.icon
            iconElement.style.paddingLeft = "0.5rem"
            iconElement.style.fontFamily = "initial"
            cardElement.append(iconElement)

            cardSettings.append(cardElement)
            deckMenu.append(cardSettings)
        }
        menu.append(deckMenu)

        this.root.append(menu)
    }
}