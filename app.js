import GameRender from "./render/render.js";
import Game from "./game/game.js";
import EventManager from "./utils/events.js";
import DirectRobotController from "./controller/directRobotController.js";
import RandobotController from "./controller/randobotController.js";
import NoopController from "./controller/noopController.js";

const MAIN_PEER_ID = "connectPeer";

export default class Application {
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
    ]
    leftControllerIndex = 0
    rightControllerIndex = 1

    connections = []

    /**
     * @param {Element} root
     */
    constructor(root) {
        this.root = root
        this.peer = new Peer()
        this.peer.on('connection', (connection) => {
            console.info("A wild Peer appeared!")
            connection.on('open', () => {
                connection.on('data', function(data) {
                    console.log('Received', data)
                });

                this.connections.push(connection)
            })
        });
    }

    start() {
        const parsedUrl = new URL(window.location.href)
        const mainPeerId = parsedUrl.searchParams.get(MAIN_PEER_ID)
        if (!mainPeerId) {
            return this.showMenu()
        }
        this.connectTo(mainPeerId)
    }

    startGame() {
        this.clear()

        const eventManager = new EventManager()
        eventManager.listenToAll((type, payload) => this.connections.forEach((connection) => connection.send({type, payload})))

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

        const heading = document.createElement("h1")
        heading.classList.add("line")
        heading.textContent = "PUNCH_CARDS"
        menu.append(heading)

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
        inviteLinkInput.value = this.peer.id ? this._createInviteLink() : inviteLinkDefaultText
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
        this.peer.on('open', (id) => {
            console.info('Peer.js is ready to connect. Peer ID is ' + id)
            const inviteLinkInput = document.getElementById('invite-link-input')
            if (inviteLinkInput) {
                inviteLinkInput.value = this._createInviteLink()
            }
        });

        const leftControllerHeading = document.createElement('div')
        leftControllerHeading.classList.add('line')
        leftControllerHeading.append("Choose left controller:")
        menu.append(leftControllerHeading)

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

        const rightControllerHeading = document.createElement('div')
        rightControllerHeading.classList.add('line')
        rightControllerHeading.append("Choose right controller:")
        menu.append(rightControllerHeading)

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

        const startGameButton = document.createElement('div')
        startGameButton.classList.add('button')
        startGameButton.classList.add('clickable')
        startGameButton.textContent = 'Fight!'
        startGameButton.addEventListener("click", () => this.startGame())
        menu.append(startGameButton)

        this.root.append(menu)
    }

    streaming = false
    connectTo(mainPeerId) {
        this.clear()

        const menu = document.createElement('div')
        menu.classList.add('menu')

        const heading = document.createElement("h1")
        heading.classList.add("line")
        heading.textContent = "PUNCH_CARDS"
        menu.append(heading)

        const message = document.createElement('div')
        message.classList.add('line')
        message.append("connecting to the network...")
        menu.append(message)

        this.root.append(menu)

        this.peer.on('open', (id) => {
            const message = document.createElement('div')
            message.classList.add('line')
            message.append("connecting to the game...")
            menu.append(message)

            console.info('Peer.js is ready to connect. Peer ID is ' + id)
            const connection = this.peer.connect(mainPeerId, {serialization: "json"})
            connection.on('open', () => {
                const message = document.createElement('div')
                message.classList.add('line')
                message.append("connection opened!")
                menu.append(message)

                const eventManager = new EventManager()

                connection.on('data', (data) => {
                    console.log('Received', data)

                    if (!this.streaming) {
                        this.streaming = true
                        this.clear()

                        new GameRender(
                            this.root,
                            eventManager,
                            new NoopController(),
                            new NoopController(),
                        )
                    }

                    eventManager.publish(data.type, data.payload)
                });
            });
        });
    }

    clear() {
        clearInterval(this.gameTickInterval)
        this.root.innerHTML = ''
    }

    _createInviteLink() {
        const parsedUrl = new URL(window.location.href)
        parsedUrl.searchParams.set(MAIN_PEER_ID, this.peer.id)
        return parsedUrl.toString()
    }
}
