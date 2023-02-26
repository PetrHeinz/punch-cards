import EventManager from "../utils/events.js";
import {appendButton, appendHeading, appendLine, clear} from "./documentEdit.js";
import Timer from "../utils/timer.js";
import ControllableCardsRender from "../render/controllableCardsRender.js";
import RemoteControl from "../controller/remoteControl.js";
import {ROBOT_SIDE_LEFT, ROBOT_SIDE_RIGHT} from "../game/robot.js";
import TickRender from "../render/tickRender.js";

export default class AppMobile {
    /**
     * @param {Element} root
     * @param {string} serverPeerId
     * @param {string} side
     */
    constructor(root, serverPeerId, side) {
        if (side !== ROBOT_SIDE_RIGHT && side !== ROBOT_SIDE_LEFT) throw "Unknown side " + side
        this.root = root
        this.side = side;
        this.peer = new Peer()
        this.eventManager = new EventManager()
        this.timer = new Timer()
        this.peer.on('open', id => {
            console.info('Peer.js is ready to connect. Peer ID is ' + id)
            this.serverConnection = this.peer.connect(serverPeerId, {serialization: "json"})
            this.serverConnection.on('data', data => {
                console.debug('Received data from server: ', data)
                this.eventManager.publish(data.type, data.payload)
            })
            this.serverConnection.on("error", error => console.error(error))
        });
        this.peer.on("error", error =>  console.error(error))

        this.eventManager.listen("gameEnded", () => this.eventManager.clear())
    }

    showLoading() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        appendLine(menu, "connecting to the network...")

        this.peer.on("error", () => appendLine(menu, 'NETWORK CONNECTION ERROR'))

        this.peer.on('open', () => {
            appendLine(menu, 'connection to the network opened')
            appendLine(menu, "connecting to the server...")

            this.serverConnection.on('open', () => {
                appendLine(menu, "connection to the server opened")

                appendButton(menu, 'Ready!', () => this.waitForGame())
            })

            this.serverConnection.on("error", () => appendLine(menu, 'SERVER CONNECTION ERROR'))
        })

        this.root.append(menu)
    }

    waitForGame() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)
        appendLine(menu, "waiting for a game to start...")

        this.root.append(menu)

        this.timer.doPeriodically(() => this.serverConnection.send("ready"), 200, 0)

        this.eventManager.listen("gameStarted", options => this.showGame(options))
        this.eventManager.listen("gameEnded", () => this.waitForAnotherGame())
    }

    waitForAnotherGame() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)
        appendLine(menu, "game ended")
        appendLine(menu, "waiting for another game to start...")

        this.timer.doPeriodically(() => this.serverConnection.send("ready"), 200, 0)

        this.root.append(menu)
    }

    showGame(options) {
        clear(this.root)
        this.timer.clear()

        const tickRender = new TickRender(options.tickTimeout)
        const cardsRender = new ControllableCardsRender(new RemoteControl(this.side, this.serverConnection))

        tickRender.appendTo(this.root)
        cardsRender.initialize(this.root)

        const robotInfoUpdateEvent = this.side === ROBOT_SIDE_LEFT ? "leftRobotInfoUpdate" : "rightRobotInfoUpdate";
        const cardsInfoUpdateEvent = this.side === ROBOT_SIDE_LEFT ? "leftCardsInfoUpdate" : "rightCardsInfoUpdate";

        this.eventManager.listen(robotInfoUpdateEvent, ({timeToInput, state}) => tickRender.renderTimeToInput(timeToInput, state))
        this.eventManager.listen(cardsInfoUpdateEvent, cardsInfo => cardsRender.render(cardsInfo))
        this.eventManager.listen("tick", ({tickCounter}) => tickRender.renderTick(tickCounter))
    }
};