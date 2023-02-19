import DirectRobotController from "../controller/directRobotController.js";
import RandobotController from "../controller/randobotController.js";
import EventManager from "../utils/events.js";
import Game from "../game/game.js";
import GameRender from "../render/gameRender.js";
import {appendButton, appendHeading, appendInput, appendLine, clear} from "./documentEdit.js";
import RemoteReceiverController from "../controller/remoteReceiverController.js";
import Timer from "../utils/timer.js";

export default class AppServer {
    randomSeedString = "punch-cards"
    controllers = [
        {
            name: 'Direct control',
            create: (robot) => new DirectRobotController(robot),
        },
        {
            name: 'Randobot',
            create: (robot) => new RandobotController(robot, this.randomSeedString),
        },
        {
            name: 'Remote control',
            create: (robot) => new RemoteReceiverController(robot, (listener) => this.controllerListeners.push(listener)),
        },
    ]
    leftControllerIndex = 0
    rightControllerIndex = 1

    clientConnections = []
    controllerListeners = []

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
                console.debug('Received', data)
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

    startGame() {
        this.clear()

        const eventManager = new EventManager()
        eventManager.listenToAll((type, payload) => this.clientConnections.forEach((connection) => connection.send({type, payload})))

        const tickTimeout = 1000;
        let game = new Game(this.randomSeedString, eventManager)
        let gameRender = new GameRender(
            this.root,
            eventManager,
            this.controllers[this.leftControllerIndex].create(game.leftRobot),
            this.controllers[this.rightControllerIndex].create(game.rightRobot),
            tickTimeout,
        )

        eventManager.publish("gameStarted", {tickTimeout})

        gameRender.addMenuButton("BACK_TO_MENU", () => {
            eventManager.publish("gameEnded", {})
            this.showMenu()
        })
        gameRender.addMenuButton("RESTART_GAME", () => {
            eventManager.publish("gameEnded", {})
            this.startGame()
        })

        this.timer.doInSequence(tickTimeout,
            () => eventManager.publish("messageOverlay", {text: "3…"}),
            () => eventManager.publish("messageOverlay", {text: "2…"}),
            () => eventManager.publish("messageOverlay", {text: "1…"}),
            () => eventManager.publish("messageOverlay", {text: "GO!"}),
            () => eventManager.publish("messageOverlay", {text: ""}),
        )

        this.timer.doPeriodically(() => game.tick(), tickTimeout, 3*tickTimeout)
    }

    showMenu() {
        this.clear()

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        const randomSeedStringInput = appendInput(menu, "Random seed string", this.randomSeedString)
        randomSeedStringInput.addEventListener("input", () => {
            const randomSeedString = randomSeedStringInput.value.trim()
            this.randomSeedString = randomSeedString !== "" ? randomSeedString : null
        })

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

        appendButton(menu, "Fight!", () => this.startGame())

        this.root.append(menu)
    }

    clear() {
        this.timer.clear()
        clear(this.root)
    }
}