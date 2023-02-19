import RobotRender from "./robotRender.js";

export default class GameRender {
    constructor(root, eventManager, leftController, rightController, tickTimeout) {
        if (root.children.length > 0) {
            throw "Root element is not empty"
        }
        const game = document.createElement('div')
        game.classList.add('game')

        this.menu = document.createElement("div")
        this.menu.classList.add("menu-upper")
        game.append(this.menu)

        this.leftRobot = new RobotRender(game, 'left', leftController)
        this.rightRobot = new RobotRender(game, 'right', rightController)

        root.append(game)

        eventManager.listen("leftRobotInfoUpdate", (leftRobotInfo) => this.leftRobot.renderRobotInfo(leftRobotInfo))
        eventManager.listen("rightRobotInfoUpdate", (rightRobotInfo) => this.rightRobot.renderRobotInfo(rightRobotInfo))
        eventManager.listen("leftCardsInfoUpdate", (leftCardsInfo) => this.leftRobot.renderCardsInfo(leftCardsInfo))
        eventManager.listen("rightCardsInfoUpdate", (rightCardsInfo) => this.rightRobot.renderCardsInfo(rightCardsInfo))

        let currentTickTimeout = 0
        eventManager.listen("actionPhaseInfoUpdate.prepare", ({leftRobotInfo, rightRobotInfo}) => {
            this._renderRobotsInfoWithTimeout(leftRobotInfo, rightRobotInfo)
        })
        eventManager.listen("actionPhaseInfoUpdate.do", ({leftRobotInfo, rightRobotInfo}) => {
            this._renderRobotsInfoWithTimeout(leftRobotInfo, rightRobotInfo, .5 * currentTickTimeout)
        })
        eventManager.listen("actionPhaseInfoUpdate.cleanup", ({leftRobotInfo, rightRobotInfo}) => {
            this._renderRobotsInfoWithTimeout(leftRobotInfo, rightRobotInfo, .55 * currentTickTimeout)
        })
        currentTickTimeout = tickTimeout
    }

    _renderRobotsInfoWithTimeout(leftRobotInfo, rightRobotInfo, timeout = 0) {
        if (timeout === 0) {
            this.leftRobot.renderRobotInfo(leftRobotInfo)
            this.rightRobot.renderRobotInfo(rightRobotInfo)
            return
        }

        setTimeout(() => {
            this.leftRobot.renderRobotInfo(leftRobotInfo)
            this.rightRobot.renderRobotInfo(rightRobotInfo)
        }, timeout)
    }

    addMenuButton(text, callback) {
        let button = document.createElement("div")
        button.classList.add("clickable")
        button.textContent = text
        button.addEventListener("click", () => callback())

        this.menu.append(button)
    }
}

