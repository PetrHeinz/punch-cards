import EventManager from "../utils/events.js";
import Game from "../game/game.js";
import GameRender from "../render/gameRender.js";
import {appendButton, appendHeading, appendInput, appendLine, clear} from "./documentEdit.js";
import Timer from "../utils/timer.js";
import ControllableCardsRender from "../render/controllableCardsRender.js";
import DirectControl from "../controller/directControl.js";
import HiddenCardsRender from "../render/hiddenCardsRender.js";
import RemoteControl from "../controller/remoteControl.js";
import {createCardByType, getAllTypes} from "../game/cards.js";
import CardsRender from "../render/cardsRender.js";
import Bot from "../controller/bot.js";
import {RANDOM_CARD, ROBOT_SIDE_LEFT, ROBOT_SIDE_RIGHT} from "../game/robot.js";

export default class AppServer {
    randomSeedString = "punch-cards"
    actionsCount = 3
    cardsCount = 5
    maxTimeToInput = 5
    tickInterval = 1000
    deckCards = {up2: 2, up3: 1, down2: 2, down3: 1, hand_flip: 1, punch: 2, up_flip: 1, down_flip: 1, flip_punch: 1, charge: 2, push_up: 2, push_down: 2, repair: 2, reinforce: 1}
    cards = ["punch", "up1", "down1"]

    clientConnections = []
    controllerListeners = []
    gameType = "unknown"

    setupGame = () => { throw "No game setup initialized!" }
    restartGame = () => this.startGame()
    onRemoteReady = () => {}

    /**
     * @param {Element} root
     * @param {function(string,?string):string} createInviteLink
     */
    constructor(root, createInviteLink) {
        this.root = root
        this.createInviteLink = createInviteLink
        this.peer = new Peer()
        this.timer = new Timer()
        this.peer.on('open', (id) => {
            console.info('Peer.js is ready to connect. Peer ID is ' + id)
        })
        this.peer.on('connection', (connection) => {
            console.info("Client connected")
            connection.on('open', () => {
                this.clientConnections.push(connection)
            })
            connection.on('data', (data) => {
                console.debug('Received data from client: ', data)

                if (data.message === "ready") {
                    console.debug("Client is ready: ", {connection, side: data.side})
                    this.onRemoteReady({connection, side: data.side})
                    return
                }

                this.controllerListeners.forEach((listener) => listener(data))
            })
            connection.on("error", (error) => {
                console.error(error)
            })
        })
        this.peer.on("error", (error) => {
            console.error(error)
        })
    }

    setupGameAgainstBot() {
        this.gameType = "against_bot"

        this.setupGame = (game) => {
            const bot = new Bot(game.rightRobot, () => game.copy(true), this.randomSeedString)
            bot.start()

            return {
                leftCardsRender: new ControllableCardsRender(new DirectControl(game.leftRobot)),
                rightCardsRender: new HiddenCardsRender(),
            }
        }

        this.startGame()
    }

    setupGameAgainstLocalFriend() {
        this.gameType = "against_local_friend"

        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        appendLine(menu, "Control the robots via mobile phones...")

        const leftSide = document.createElement('div')
        leftSide.classList.add("menu-half")
        appendLine(leftSide, "Left robot")
        const leftQrCode = document.createElement('div')
        leftQrCode.classList.add("qr-code")
        leftSide.append(leftQrCode)
        this.appendInviteLinkInput(leftSide, "...or send the link", ROBOT_SIDE_LEFT)

        const rightSide = document.createElement('div')
        rightSide.classList.add("menu-half")
        appendLine(rightSide, "Right robot")
        const rightQrCode = document.createElement('div')
        rightQrCode.classList.add("qr-code")
        rightSide.append(rightQrCode)
        this.appendInviteLinkInput(rightSide, "...or send the link", ROBOT_SIDE_RIGHT)
        const createQrCode = (peerId, element, side) => new QRCode(element,  this.createInviteLink(peerId, side))
        const renderQrCodes = (peerId) => {
            createQrCode(peerId, leftQrCode, ROBOT_SIDE_LEFT)
            createQrCode(peerId, rightQrCode, ROBOT_SIDE_RIGHT)
        }
        this.peer.on('open', (peerId) => renderQrCodes(peerId))
        if (this.peer.id) {
            renderQrCodes(this.peer.id)
        }
        menu.append(leftSide)
        menu.append(rightSide)

        appendLine(menu, "waiting for both of you to connect...")

        this.setupGame = (game) => {
            this.controllerListeners.push(RemoteControl.createReceiver(game.leftRobot))
            this.controllerListeners.push(RemoteControl.createReceiver(game.rightRobot))

            return {
                leftCardsRender: new HiddenCardsRender(),
                rightCardsRender: new HiddenCardsRender(),
            }
        }

        let leftReady = false
        let rightReady = false

        this.restartGame = () => this.setupGameAgainstRemoteFriend()
        this.onRemoteReady = ({side}) => {
            if (side === "remote") return

            let sideElement
            if (side === ROBOT_SIDE_LEFT) {
                leftReady = true
                sideElement = leftSide
            }
            if (side === ROBOT_SIDE_RIGHT) {
                rightReady = true
                sideElement = rightSide
            }
            sideElement.innerHTML = ""
            appendLine(sideElement, side)
            appendLine(sideElement, "CONNECTED")

            if (leftReady && rightReady) {
                this.startGame()
            }
        }

        appendButton(menu, "Back", () => this.showMenu())

        this.root.append(menu)
    }

    setupGameAgainstRemoteFriend() {
        this.gameType = "against_remote_friend"

        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        this.appendInviteLinkInput(menu, "Invite friends via URL")

        appendLine(menu, "waiting for a friend...")

        this.setupGame = (game) => {
            this.controllerListeners.push(RemoteControl.createReceiver(game.rightRobot))

            return {
                leftCardsRender: new ControllableCardsRender(new DirectControl(game.leftRobot)),
                rightCardsRender: new HiddenCardsRender(),
            }
        }

        this.restartGame = () => this.setupGameAgainstRemoteFriend()
        this.onRemoteReady = ({side}) => {
            if (side === "remote") this.startGame()
        }

        appendButton(menu, "Back", () => this.showMenu())

        this.root.append(menu)
    }

    setupGameWithTwoBots() {
        this.gameType = "with_two_bots"

        this.setupGame = (game) => {
            const leftBot = new Bot(game.leftRobot, () => game.copy(true), `${this.randomSeedString}-left`)
            const rightBot = new Bot(game.rightRobot, () => game.copy(true), `${this.randomSeedString}-left`)

            leftBot.start()
            rightBot.start()

            return {
                leftCardsRender: new CardsRender(),
                rightCardsRender: new CardsRender(),
            }
        }

        this.startGame()
    }

    startGame() {
        this.clear()

        const eventManager = new EventManager()
        eventManager.listenToAll((type, payload) => this.clientConnections.forEach((connection) => connection.send({type, payload})))

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

        const game = new Game(gameOptions, eventManager)
        const gameSetup = this.setupGame(game)
        const gameRender = new GameRender(this.root, eventManager, gameSetup.leftCardsRender, gameSetup.rightCardsRender, this.tickInterval)

        const gameStartedPayload = {
            tickTimeout: this.tickInterval,
            gameType: this.gameType,
        };
        eventManager.publish("gameStarted", gameStartedPayload)
        this.onRemoteReady = ({connection}) => {
            game.clearUpdateCache()
            this.timer.doAfter(() => connection.send({type: "gameStarted", payload: gameStartedPayload}), this.tickInterval)
        }

        gameRender.addMenuButton("BACK_TO_MENU", () => {
            eventManager.publish("gameEnded", {})
            this.onRemoteReady = () => {}
            this.showMenu()
        })
        gameRender.addMenuButton("RESTART_GAME", () => {
            eventManager.publish("gameEnded", {})
            this.onRemoteReady = () => {}
            this.restartGame()
        })

        this.timer.doInSequence(this.tickInterval,
            () => eventManager.publish("messageOverlay", {text: "3…"}),
            () => eventManager.publish("messageOverlay", {text: "2…"}),
            () => eventManager.publish("messageOverlay", {text: "1…"}),
            () => eventManager.publish("messageOverlay", {text: "GO!"}),
            () => eventManager.publish("messageOverlay", {text: ""}),
        )

        this.timer.doPeriodically(() => {
            game.tick()
            if (game.isOver()) {
                eventManager.publish("messageOverlay", {text: "GAME OVER"})
                this.timer.clear()
            }
        }, this.tickInterval, 3 * this.tickInterval)
    }

    showMenu() {
        this.clear()
        this.setupGame = () => { throw "No game setup initialized!" }
        this.restartGame = () => this.startGame()

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

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

        this.appendInviteLinkInput(menu, "Invite friends via URL")

        appendLine(menu, "Choose game mode:")

        const gameAgainstBotButton = appendLine(menu, "Battle a bot")
        gameAgainstBotButton.classList.add("clickable", "with-hover", "indented")
        gameAgainstBotButton.addEventListener("click", () => this.setupGameAgainstBot())

        const gameAgainstLocalFriendButton = appendLine(menu, "Fight with a friend locally")
        gameAgainstLocalFriendButton.classList.add("clickable", "with-hover", "indented")
        gameAgainstLocalFriendButton.addEventListener("click", () => this.setupGameAgainstLocalFriend())

        const gameAgainstRemoteFriendButton = appendLine(menu, "Dominate a friend over network")
        gameAgainstRemoteFriendButton.classList.add("clickable", "with-hover", "indented")
        gameAgainstRemoteFriendButton.addEventListener("click", () => this.setupGameAgainstRemoteFriend())

        const gameWithTwoBotsButton = appendLine(menu, "Watch two bots fight")
        gameWithTwoBotsButton.classList.add("clickable", "with-hover", "indented")
        gameWithTwoBotsButton.addEventListener("click", () => this.setupGameWithTwoBots())

        appendLine(menu, "Advanced options:")

        const deckCustomizationButton = appendLine(menu, "Customize cards")
        deckCustomizationButton.classList.add("clickable", "with-hover", "indented")
        deckCustomizationButton.addEventListener("click", () => this.showDeckCustomization())

        this.root.append(menu)
    }

    showDeckCustomization() {
        this.clear()

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
        appendButton(cardsMenu, "Save", () => this.showMenu())
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

    appendInviteLinkInput(menu, labelText, side) {
        const inviteLinkDefaultText = "connecting to the network...";
        const inviteLinkInput = appendInput(menu, labelText, this.peer.id ? this.createInviteLink(this.peer.id, side) : inviteLinkDefaultText)
        inviteLinkInput.style.fontSize = "60%"
        inviteLinkInput.style.letterSpacing = "calc(-.1 * var(--fontsize))"
        inviteLinkInput.readOnly = true
        this.peer.on('open', (peerId) => {
            inviteLinkInput.value = this.createInviteLink(peerId, side)
        })
        inviteLinkInput.classList.add("status")
        inviteLinkInput.addEventListener("click", () => {
            if (inviteLinkInput.value === inviteLinkDefaultText) return
            inviteLinkInput.select()
            navigator.clipboard.writeText(inviteLinkInput.value).then(() => {
                inviteLinkInput.classList.add("success")
                setTimeout(() => inviteLinkInput.classList.remove("success"), 1000)
            })
        })
    }

    clear() {
        this.timer.clear()
        this.controllerListeners = []
        clear(this.root)
    }
}