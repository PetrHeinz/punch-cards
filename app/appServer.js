import EventManager from "../utils/events.js";
import Game from "../game/game.js";
import GameRender from "../render/gameRender.js";
import {appendButton, appendHeading, appendInput, appendLine, clear} from "./documentEdit.js";
import Timer from "../utils/timer.js";
import ControllableCardsRender from "../render/controllableCardsRender.js";
import DirectControl from "../controller/directControl.js";
import HiddenCardsRender from "../render/hiddenCardsRender.js";
import RemoteControl from "../controller/remoteControl.js";
import CardsRender from "../render/cardsRender.js";
import Bot from "../controller/bot.js";
import {ROBOT_SIDE_LEFT, ROBOT_SIDE_RIGHT} from "../game/robot.js";
import Options from "./options.js";

export default class AppServer {
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
        this.options = new Options(this.root, () => this.showMenu())
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

        const game = new Game(this.options.gameOptions, eventManager)
        const gameSetup = this.setupGame(game)
        const gameRender = new GameRender(this.root, eventManager, gameSetup.leftCardsRender, gameSetup.rightCardsRender, this.options.tickInterval)

        const gameStartedPayload = {
            tickTimeout: this.options.tickInterval,
            gameType: this.gameType,
        };
        eventManager.publish("gameStarted", gameStartedPayload)
        this.onRemoteReady = ({connection}) => {
            game.clearUpdateCache()
            this.timer.doAfter(() => connection.send({type: "gameStarted", payload: gameStartedPayload}), this.options.tickInterval)
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

        this.timer.doInSequence(this.options.tickInterval,
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
        }, this.options.tickInterval, 3 * this.options.tickInterval)
    }

    showMenu() {
        this.clear()
        this.setupGame = () => { throw "No game setup initialized!" }
        this.restartGame = () => this.startGame()

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        this.options.appendOptionsToMainMenu(menu)

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
        deckCustomizationButton.addEventListener("click", () => this.options.showCardsMenu())

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