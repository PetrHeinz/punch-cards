import Randobot from "../controller/randobot.js";
import EventManager from "../utils/events.js";
import Game from "../game/game.js";
import GameRender from "../render/gameRender.js";
import {appendButton, appendHeading, appendInput, appendLine, clear} from "./documentEdit.js";
import Timer from "../utils/timer.js";
import ControllableCardsRender from "../render/controllableCardsRender.js";
import DirectControl from "../controller/directControl.js";
import HiddenCardsRender from "../render/hiddenCardsRender.js";
import RemoteControl from "../controller/remoteControl.js";

export default class AppServer {
    randomSeedString = "punch-cards"
    maxTimeToInput = 5
    tickInterval = 1000

    controllers = [
        {
            name: 'Direct control',
            remoteControl: false,
            createCardsRender: (robot) => {
                return new ControllableCardsRender(new DirectControl(robot))
            },
        },
        {
            name: 'Randobot',
            remoteControl: false,
            createCardsRender: (robot) => {
                const randobot = new Randobot(robot, this.randomSeedString)
                randobot.start()

                return new HiddenCardsRender()
            },
        },
        {
            name: 'Remote control',
            remoteControl: true,
            createCardsRender: (robot) => {
                this.controllerListeners.push(RemoteControl.createReceiver(robot))

                return new HiddenCardsRender()
            },
        },
    ]
    leftControllerIndex = 0
    rightControllerIndex = 1

    clientConnections = []
    controllerListeners = []

    onRemoteReady = () => {}

    /**
     * @param {Element} root
     * @param {function(string):string} createInviteLink
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

                if (data === "ready") {
                    this.onRemoteReady(connection)
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

    startGameWhenReady() {
        if (!this.controllers[this.leftControllerIndex].remoteControl && !this.controllers[this.rightControllerIndex].remoteControl) {
            this.startGame()
            return
        }
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        this.appendInviteLinkInput(menu)

        appendLine(menu, "waiting for friends...")

        this.root.append(menu)

        this.onRemoteReady = () => this.startGame()
    }

    startGame() {
        this.clear()

        const eventManager = new EventManager()
        eventManager.listenToAll((type, payload) => this.clientConnections.forEach((connection) => connection.send({type, payload})))

        const gameOptions = {
            randomSeedString: this.randomSeedString,
            robotOptions: {
                maxTimeToInput: this.maxTimeToInput,
            }
        }

        let game = new Game(gameOptions, eventManager)
        let gameRender = new GameRender(
            this.root,
            eventManager,
            this.controllers[this.leftControllerIndex].createCardsRender(game.leftRobot),
            this.controllers[this.rightControllerIndex].createCardsRender(game.rightRobot),
            this.tickInterval,
        )

        const gameStartedPayload = {
            tickTimeout: this.tickInterval,
            leftRemoteControl: this.controllers[this.leftControllerIndex].remoteControl,
            rightRemoteControl: this.controllers[this.rightControllerIndex].remoteControl,
        };
        eventManager.publish("gameStarted", gameStartedPayload)
        this.onRemoteReady = connection => {
            game.clearUpdateCache()
            this.timer.doAfter(() => connection.send({type: "gameStarted", payload: gameStartedPayload}), tickTimeout)
        }

        gameRender.addMenuButton("BACK_TO_MENU", () => {
            eventManager.publish("gameEnded", {})
            this.onRemoteReady = () => {}
            this.showMenu()
        })
        gameRender.addMenuButton("RESTART_GAME", () => {
            eventManager.publish("gameEnded", {})
            this.onRemoteReady = () => {}
            this.startGameWhenReady()
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

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        const randomSeedStringInput = appendInput(menu, "Random seed string", this.randomSeedString)
        randomSeedStringInput.style.width = "16em"
        randomSeedStringInput.addEventListener("input", () => {
            const randomSeedString = randomSeedStringInput.value.trim()
            this.randomSeedString = randomSeedString !== "" ? randomSeedString : null
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

        this.appendInviteLinkInput(menu)

        appendLine(menu, "Choose left controller:")

        this.controllers.forEach((controller, index) => {
            const element = document.createElement('div')
            element.classList.add('line')
            element.classList.add("controller-left")
            element.append(controller.name)
            element.classList.toggle("selected", this.leftControllerIndex === index)
            element.addEventListener("click", () => {
                this.leftControllerIndex = index
                menu.querySelectorAll(".controller-left")
                    .forEach((e, i) => e.classList.toggle("selected", i === index))
            })
            menu.append(element)
        })

        appendLine(menu, "Choose right controller:")

        this.controllers.forEach((controller, index) => {
            const element = document.createElement('div')
            element.classList.add('line')
            element.classList.add("controller-right")
            element.append(controller.name)
            element.classList.toggle("selected", this.rightControllerIndex === index)
            element.addEventListener("click", () => {
                this.rightControllerIndex = index
                menu.querySelectorAll(".controller-right")
                    .forEach((e, i) => e.classList.toggle("selected", i === index))
            })
            menu.append(element)
        })

        appendButton(menu, "Fight!", () => this.startGameWhenReady())

        this.root.append(menu)
    }

    appendInviteLinkInput(menu) {
        const inviteLinkDefaultText = "connecting to the network...";
        const inviteLinkInput = appendInput(menu, "Invite friends via URL", this.peer.id ? this.createInviteLink(this.peer.id) : inviteLinkDefaultText)
        inviteLinkInput.readOnly = true
        this.peer.on('open', (peerId) => {
            inviteLinkInput.value = this.createInviteLink(peerId)
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