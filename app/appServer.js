import DirectRobotController from "../controller/directRobotController.js";
import RandobotController from "../controller/randobotController.js";
import EventManager from "../utils/events.js";
import Game from "../game/game.js";
import GameRender from "../render/gameRender.js";
import {appendButton, appendHeading, appendLine, clear} from "./documentEdit.js";
import RemoteReceiverController from "../controller/remoteReceiverController.js";

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
        this.peer.on('connection', (connection) => {
            console.info("Client connected")
            connection.on('open', () => {
                this.clientConnections.push(connection)
            })
            connection.on('data', (data) => {
                console.debug('Received', data)
                this.controllerListeners.forEach((listener) => listener(data))
            });
            connection.on("error", (error) => {
                console.error(error)
            })
        });
        this.peer.on("error", (error) => {
            console.error(error)
        })
    }

    startGame() {
        this.clear()

        const eventManager = new EventManager()
        eventManager.listenToAll((type, payload) => this.clientConnections.forEach((connection) => connection.send({type, payload})))

        let game = new Game(this.randomSeedString, eventManager)
        let gameRender = new GameRender(
            this.root,
            eventManager,
            this.controllers[this.leftControllerIndex].create(game.leftRobot),
            this.controllers[this.rightControllerIndex].create(game.rightRobot),
        )

        gameRender.addMenuButton("BACK_TO_MENU", () => this.showMenu())
        gameRender.addMenuButton("RESTART_GAME", () => this.startGame())

        this.gameTickInterval = setInterval(() => game.tick(), 1000)
    }

    showMenu() {
        this.clear()

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        const randomSeedStringInput = document.createElement("input")
        randomSeedStringInput.classList.add("input")
        randomSeedStringInput.size = randomSeedStringInput.maxLength = 32
        randomSeedStringInput.value = this.randomSeedString
        randomSeedStringInput.addEventListener("input", () => {
            const randomSeedString = randomSeedStringInput.value.trim()
            this.randomSeedString = randomSeedString !== "" ? randomSeedString : null
        })
        const randomSeedStringLabel = document.createElement("label")
        randomSeedStringLabel.classList.add("line")
        randomSeedStringLabel.append("Random seed string: ")
        randomSeedStringLabel.append(randomSeedStringInput)
        menu.append(randomSeedStringLabel)

        const inviteLinkInput = document.createElement("input")
        inviteLinkInput.id = 'invite-link-input'
        inviteLinkInput.classList.add("input")
        inviteLinkInput.readOnly = true
        inviteLinkInput.size = 32
        const inviteLinkDefaultText = "connecting to the network...";
        inviteLinkInput.value = this.peer.id ? this.createInviteLink(this.peer.id) : inviteLinkDefaultText
        inviteLinkInput.addEventListener("click", () => {
            if (inviteLinkInput.value === inviteLinkDefaultText) return
            inviteLinkInput.select()
            navigator.clipboard.writeText(inviteLinkInput.value)
        })
        const inviteLinkLabel = document.createElement("label")
        inviteLinkLabel.classList.add("line")
        inviteLinkLabel.append("Invite friends: ")
        inviteLinkLabel.append(inviteLinkInput)
        menu.append(inviteLinkLabel)
        this.peer.on('open', (peerId) => {
            const inviteLinkInput = document.getElementById('invite-link-input')
            if (inviteLinkInput) {
                inviteLinkInput.value = this.createInviteLink(peerId)
            }
        });

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
        clearInterval(this.gameTickInterval)
        clear(this.root)
    }
}