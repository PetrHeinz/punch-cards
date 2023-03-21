import AppClient from "./app/appClient.js";
import AppServer from "./app/appServer.js";
import AppMobile from "./app/appMobile.js";

export default class Application {
    /**
     * @param {Element} root
     */
    constructor(root) {
        this.root = root
    }

    start() {
        const serverPeerIdParam = "connectPeer";
        const sideParam = "side";
        const currentUrl = new URL(window.location.href)
        const serverPeerId = currentUrl.searchParams.get(serverPeerIdParam)

        if (!serverPeerId) {
            const server = new AppServer(this.root, (peerId, side) => {
                const inviteLinkUrl = new URL(window.location.href)
                inviteLinkUrl.searchParams.set(serverPeerIdParam, peerId)
                if (side) {
                    inviteLinkUrl.searchParams.set(sideParam, side)
                }
                return inviteLinkUrl.toString()
            })
            return server.showMenu()
        }

        const side = currentUrl.searchParams.get(sideParam)
        if (side) {
            const client = new AppMobile(this.root, serverPeerId, side)
            return client.showLoading()
        }

        const client = new AppClient(this.root, serverPeerId)
        return client.showLoading()
    }
}