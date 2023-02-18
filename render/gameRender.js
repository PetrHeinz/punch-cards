import RobotRender from "./robotRender.js";

export default class GameRender {
    constructor(root, eventManager, leftController, rightController) {
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

        eventManager.listen("actionPhaseInfoUpdate.prepare", ({leftRobotInfo, rightRobotInfo}) => {
            this.leftRobot.renderRobotInfo(leftRobotInfo)
            this.rightRobot.renderRobotInfo(rightRobotInfo)
        })
        eventManager.listen("actionPhaseInfoUpdate.do", ({leftRobotInfo, rightRobotInfo}) => setTimeout(() => {
            this.leftRobot.renderRobotInfo(leftRobotInfo)
            this.rightRobot.renderRobotInfo(rightRobotInfo)
        }, 500))
        eventManager.listen("actionPhaseInfoUpdate.cleanup", ({leftRobotInfo, rightRobotInfo}) => setTimeout(() => {
            this.leftRobot.renderRobotInfo(leftRobotInfo)
            this.rightRobot.renderRobotInfo(rightRobotInfo)
        }, 550))
    }

    addMenuButton(text, callback) {
        let button = document.createElement("div")
        button.classList.add("clickable")
        button.textContent = text
        button.addEventListener("click", () => callback())

        this.menu.append(button)
    }
}

