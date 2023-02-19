import RobotRender from "./robotRender.js";
import CardsRender from "./cardsRender.js";

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

        const leftSide = document.createElement('div')
        leftSide.classList.add('side')
        leftSide.classList.add("left")
        this.leftRobot = new RobotRender(leftSide)
        this.leftCardsRender = new CardsRender(leftSide, leftController)
        game.append(leftSide)

        const rightSide = document.createElement('div')
        rightSide.classList.add('side')
        rightSide.classList.add("right")
        this.rightRobot = new RobotRender(rightSide)
        this.rightCardsRender = new CardsRender(rightSide, rightController)
        game.append(rightSide)

        this.messageOverlay = document.createElement("div")
        this.messageOverlay.classList.add("message-overlay")
        game.append(this.messageOverlay)

        root.append(game)

        eventManager.listen("messageOverlay", ({text}) => this.messageOverlay.textContent = text)

        eventManager.listen("leftRobotInfoUpdate", leftRobotInfo => this.leftRobot.render(leftRobotInfo))
        eventManager.listen("rightRobotInfoUpdate", rightRobotInfo => this.rightRobot.render(rightRobotInfo))

        eventManager.listen("leftRobotInfoUpdate", leftRobotInfo => this.leftCardsRender.renderRobotInfo(leftRobotInfo))
        eventManager.listen("rightRobotInfoUpdate", rightRobotInfo => this.rightCardsRender.renderRobotInfo(rightRobotInfo))
        eventManager.listen("leftCardsInfoUpdate", leftCardsInfo => this.leftCardsRender.renderCardsInfo(leftCardsInfo))
        eventManager.listen("rightCardsInfoUpdate", rightCardsInfo => this.rightCardsRender.renderCardsInfo(rightCardsInfo))

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
            this.leftRobot.render(leftRobotInfo)
            this.rightRobot.render(rightRobotInfo)
            return
        }

        setTimeout(() => {
            this.leftRobot.render(leftRobotInfo)
            this.rightRobot.render(rightRobotInfo)
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

