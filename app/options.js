import {appendBlankLine, appendButton, appendInput, appendLine, clear} from "./documentEdit.js";
import {createCardByType, getAllTypes} from "../game/cards.js";
import {HAND_POSITION_MAX, HAND_POSITION_MIN, RANDOM_CARD} from "../game/robot.js";

export default class Options {
    randomSeedString = "punch-cards"
    tickInterval = 1000
    settings = {
        actionsCount: 3,
        cardsCount: 5,
        maxTimeToInput: 5,
        inputOvertimeTorsoDamage: 1,
        headHealth: 40,
        torsoHealth: 80,
        heatsinkHealth: 60,
        rightHandPosition: 3,
        leftHandPosition: 5,
        deckCards: {
            up2: 2,
            up3: 1,
            down2: 2,
            down3: 1,
            hand_flip: 1,
            punch: 2,
            up_flip: 1,
            down_flip: 1,
            flip_punch: 1,
            charge: 2,
            push_up: 2,
            push_down: 2,
            repair: 2,
            reinforce: 1,
        },
        cards: ["punch", "up1", "down1"],
    }


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
                deckCards: this.settings.deckCards,
                actionsCount: this.settings.actionsCount,
                cards: Array.from(new Array(this.settings.cardsCount), (_, i) => this.settings.cards[i] ?? RANDOM_CARD),
                maxTimeToInput: this.settings.maxTimeToInput,
                inputOvertimeTorsoDamage: this.settings.inputOvertimeTorsoDamage,
                headHealth: this.settings.headHealth,
                torsoHealth: this.settings.torsoHealth,
                heatsinkHealth: this.settings.heatsinkHealth,
                rightHandPosition: this.settings.rightHandPosition,
                leftHandPosition: this.settings.leftHandPosition,
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

        const tickIntervalInput = appendInput(menu, "Game speed", this.tickInterval)
        tickIntervalInput.style.width = "4em"
        tickIntervalInput.style.textAlign = "right"
        tickIntervalInput.type = "number"
        tickIntervalInput.addEventListener("input", () => {
            this.tickInterval = parseInt(tickIntervalInput.value.trim())
        })
        tickIntervalInput.parentNode.append(" ms/tick")
    }

    showRobotMenu() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendBlankLine(menu)
        appendLine(menu, "THE ROBOT").style.fontWeight = "bold"

        const actionsCountInput = appendInput(menu, "Actions per turn", this.settings.actionsCount)
        actionsCountInput.style.width = "2em"
        actionsCountInput.type = "number"
        actionsCountInput.addEventListener("input", () => {
            this.settings.actionsCount = parseInt(actionsCountInput.value.trim())
        })

        const cardsCountInput = appendInput(menu, "Cards to choose from", this.settings.cardsCount)
        cardsCountInput.style.width = "2em"
        cardsCountInput.type = "number"
        cardsCountInput.addEventListener("input", () => {
            this.settings.cardsCount = parseInt(cardsCountInput.value.trim())
        })

        const maxTimeToInputInput = appendInput(menu, "Time limit for card input", this.settings.maxTimeToInput)
        maxTimeToInputInput.style.width = "2em"
        maxTimeToInputInput.style.textAlign = "right"
        maxTimeToInputInput.type = "number"
        maxTimeToInputInput.addEventListener("input", () => {
            const maxTimeToInput = maxTimeToInputInput.value.trim()
            this.settings.maxTimeToInput = maxTimeToInput !== "" ? parseInt(maxTimeToInput) : null
        })
        maxTimeToInputInput.parentNode.append(" ticks")

        const inputOvertimeTorsoDamageInput = appendInput(menu, "Torso overtime damage", this.settings.inputOvertimeTorsoDamage)
        inputOvertimeTorsoDamageInput.style.width = "2em"
        inputOvertimeTorsoDamageInput.style.textAlign = "right"
        inputOvertimeTorsoDamageInput.min = 1
        inputOvertimeTorsoDamageInput.type = "number"
        inputOvertimeTorsoDamageInput.addEventListener("input", () => {
            const inputOvertimeTorsoDamage = inputOvertimeTorsoDamageInput.value.trim()
            this.settings.inputOvertimeTorsoDamage = inputOvertimeTorsoDamage !== "" ? parseInt(inputOvertimeTorsoDamage) : null
        })
        inputOvertimeTorsoDamageInput.parentNode.append(" HP/tick")

        const headHealthInput = appendInput(menu, "Head", this.settings.headHealth)
        headHealthInput.style.width = "3em"
        headHealthInput.style.textAlign = "right"
        headHealthInput.min = 1
        headHealthInput.type = "number"
        headHealthInput.addEventListener("input", () => {
            const headHealth = headHealthInput.value.trim()
            this.settings.headHealth = headHealth !== "" ? parseInt(headHealth) : null
        })
        headHealthInput.parentNode.append(" HP")

        const torsoHealthInput = appendInput(menu, "Torso", this.settings.torsoHealth)
        torsoHealthInput.style.width = "3em"
        torsoHealthInput.style.textAlign = "right"
        torsoHealthInput.min = 1
        torsoHealthInput.type = "number"
        torsoHealthInput.addEventListener("input", () => {
            const torsoHealth = torsoHealthInput.value.trim()
            this.settings.torsoHealth = torsoHealth !== "" ? parseInt(torsoHealth) : null
        })
        torsoHealthInput.parentNode.append(" HP")

        const heatsinkHealthInput = appendInput(menu, "Heatsink", this.settings.heatsinkHealth)
        heatsinkHealthInput.style.width = "3em"
        heatsinkHealthInput.style.textAlign = "right"
        heatsinkHealthInput.min = 1
        heatsinkHealthInput.type = "number"
        heatsinkHealthInput.addEventListener("input", () => {
            const heatsinkHealth = heatsinkHealthInput.value.trim()
            this.settings.heatsinkHealth = heatsinkHealth !== "" ? parseInt(heatsinkHealth) : null
        })
        heatsinkHealthInput.parentNode.append(" HP")

        const leftHandPositionInput = appendInput(menu, "Initial left hand position", this.settings.leftHandPosition)
        leftHandPositionInput.style.width = "2em"
        leftHandPositionInput.min = HAND_POSITION_MIN
        leftHandPositionInput.max = HAND_POSITION_MAX
        leftHandPositionInput.type = "number"
        leftHandPositionInput.addEventListener("input", () => {
            const leftHandPosition = leftHandPositionInput.value.trim()
            this.settings.leftHandPosition = leftHandPosition !== "" ? parseInt(leftHandPosition) : null
        })

        const rightHandPositionInput = appendInput(menu, "Initial right hand position", this.settings.rightHandPosition)
        rightHandPositionInput.style.width = "2em"
        rightHandPositionInput.min = HAND_POSITION_MIN
        rightHandPositionInput.max = HAND_POSITION_MAX
        rightHandPositionInput.type = "number"
        rightHandPositionInput.addEventListener("input", () => {
            const rightHandPosition = rightHandPositionInput.value.trim()
            this.settings.rightHandPosition = rightHandPosition !== "" ? parseInt(rightHandPosition) : null
        })

        appendBlankLine(menu)

        const cardsCustomizationButton = appendLine(menu, "Customize cards")
        cardsCustomizationButton.classList.add("clickable", "with-hover")
        cardsCustomizationButton.addEventListener("click", () => this.showCardsMenu())

        appendButton(menu, "Save", () => this.backToMainMenu())

        this.root.append(menu)
    }

    showCardsMenu() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')
        menu.style.display = "flex"

        const cardsMenu = document.createElement('div')
        cardsMenu.style.flex = 1
        cardsMenu.style.position = "relative"
        appendBlankLine(cardsMenu)
        appendLine(cardsMenu, "THE CARDS").style.fontWeight = "bold"
        for (let i = 0; i < this.settings.cardsCount; i++) {
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
                cardOption.selected = cardType === this.settings.cards[i]
                cardSelect.append(cardOption)
            }
            cardSelect.addEventListener("change", () => {
                this.settings.cards[i] = cardSelect.value
            })
            line.append(cardSelect)
            cardsMenu.append(line)
        }
        appendButton(cardsMenu, "Save", () => this.backToMainMenu())
        menu.append(cardsMenu)

        const deckMenu = document.createElement('div')
        deckMenu.style.flex = 1
        appendBlankLine(deckMenu)
        appendLine(deckMenu, "THE DECK").style.fontWeight = "bold"
        for (const cardType of getAllTypes()) {
            const cardSettings = document.createElement('div')
            const card = createCardByType(cardType)

            cardSettings.classList.add("line")
            const cardCountInput = document.createElement("input")
            cardCountInput.classList.add("input")
            cardCountInput.min = 0
            cardCountInput.value = this.settings.deckCards[cardType] ?? 0
            cardCountInput.style.width = "2em"
            cardCountInput.type = "number"
            cardCountInput.style.textAlign = "right"
            cardCountInput.addEventListener("input", () => {
                this.settings.deckCards[cardType] = parseInt(cardCountInput.value.trim())
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