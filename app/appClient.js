import EventManager from "../utils/events.js";
import GameRender from "../render/gameRender.js";
import {appendButton, appendHeading, appendLine, clear} from "./documentEdit.js";
import Timer from "../utils/timer.js";
import CardsRender from "../render/cardsRender.js";
import HiddenCardsRender from "../render/hiddenCardsRender.js";
import ControllableCardsRender from "../render/controllableCardsRender.js";
import RemoteControl from "../controller/remoteControl.js";
import {ROBOT_SIDE_LEFT, ROBOT_SIDE_RIGHT} from "../game/robot.js";

export default class AppClient {
    /**
     * @param {Element} root
     * @param {string} serverPeerId
     */
    constructor(root, serverPeerId) {
        this.root = root
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

        this.timer.doPeriodically(() => this.serverConnection.send({message: "ready", side: "remote"}), 200, 0)

        this.eventManager.listen("gameStarted", gameStartedPayload => this.showGame(gameStartedPayload))
        this.eventManager.listen("gameEnded", () => this.waitForAnotherGame())
    }

    waitForAnotherGame() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)
        appendLine(menu, "game ended")
        appendLine(menu, "waiting for another game to start...")

        this.timer.doPeriodically(() => this.serverConnection.send({message: "ready", side: "remote"}), 200, 0)

        this.root.append(menu)
    }

    showGame(gameStartedPayload) {
        clear(this.root)
        this.timer.clear()

        const leftCardsRender = this._createCardsRender(ROBOT_SIDE_LEFT, gameStartedPayload.leftRemoteControl, gameStartedPayload.rightRemoteControl)
        const rightCardsRender = this._createCardsRender(ROBOT_SIDE_RIGHT, gameStartedPayload.rightRemoteControl, gameStartedPayload.leftRemoteControl)

        new GameRender(
            this.root,
            this.eventManager,
            leftCardsRender,
            rightCardsRender,
            gameStartedPayload.tickTimeout,
        )
    }

    _createCardsRender(side, thisRemoteControl, otherRemoteControl) {
        if (!thisRemoteControl && !otherRemoteControl) {
            return new CardsRender()
        }

        if (thisRemoteControl) {
            return new ControllableCardsRender(new RemoteControl(side, this.serverConnection))
        }

        return new HiddenCardsRender()
    }
}