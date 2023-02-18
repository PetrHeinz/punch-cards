import EventManager from "../utils/events.js";
import GameRender from "../render/gameRender.js";
import NoopController from "../controller/noopController.js";
import {appendButton, appendHeading, appendLine, clear} from "./documentEdit.js";
import RemoteTransmitterController from "../controller/remoteTransmitterController.js";

export default class AppClient {
    /**
     * @param {Element} root
     * @param {string} serverPeerId
     */
    constructor(root, serverPeerId) {
        this.root = root
        this.peer = new Peer()
        this.eventManager = new EventManager()
        this.peer.on('open', (id) => {
            console.info('Peer.js is ready to connect. Peer ID is ' + id)
            this.serverConnection = this.peer.connect(serverPeerId, {serialization: "json"})
            this.serverConnection.on('data', (data) => {
                console.debug('Received', data)
                this.eventManager.publish(data.type, data.payload)
            });
            this.serverConnection.on("error", (error) => {
                console.error(error)
            })
        });
        this.peer.on("error", (error) => {
            console.error(error)
        })
    }

    showLoading() {
        clear(this.root)

        const menu = document.createElement('div')
        menu.classList.add('menu')

        appendHeading(menu)

        appendLine(menu, "connecting to the network...");

        this.peer.on("error", (error) => {
            appendLine(menu, 'NETWORK CONNECTION ERROR')
        })

        this.peer.on('open', () => {
            appendLine(menu, 'connection to the network opened')
            appendLine(menu, "connecting to the server...");

            this.serverConnection.on('open', () => {
                appendLine(menu, "connection to the server opened");
            })

            let dataReceived = false
            this.serverConnection.on('data', () => {
                if (dataReceived) return
                dataReceived = true

                appendLine(menu, "first data received from server, ready to go");

                appendButton(menu, 'Ready!', () => this.showGame())
            })

            this.serverConnection.on("error", (error) => {
                appendLine(menu, 'SERVER CONNECTION ERROR')
            })
        })

        this.root.append(menu)
    }

    showGame() {
        clear(this.root)

        new GameRender(
            this.root,
            this.eventManager,
            new RemoteTransmitterController((data) => this.serverConnection.send(data)),
            new RemoteTransmitterController((data) => this.serverConnection.send(data)),
        )
    }
}