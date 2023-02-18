import AppClient from "./app/appClient.js";
import AppServer from "./app/appServer.js";

export default class Application {
    /**
     * @param {Element} root
     */
    constructor(root) {
        this.root = root
    }

    start() {
        const serverPeerIdParam = "connectPeer";
        const currentUrl = new URL(window.location.href)
        const serverPeerId = currentUrl.searchParams.get(serverPeerIdParam)

        if (!serverPeerId) {
            const server = new AppServer(this.root, (peerId) => {
                const inviteLinkUrl = new URL(window.location.href)
                inviteLinkUrl.searchParams.set(serverPeerIdParam, peerId)
                return inviteLinkUrl.toString()
            })
            return server.showMenu()
        }

        const client = new AppClient(this.root, serverPeerId)
        client.showLoading(serverPeerId)
    }
}
