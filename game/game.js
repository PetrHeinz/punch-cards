import {createDeck} from "./cards.js";
import RandomGenerator from "../utils/randomGenerator.js";
import Robot, {
    ROBOT_SIDE_LEFT,
    ROBOT_SIDE_RIGHT,
    ROBOT_STATE_ACTION,
    ROBOT_STATE_COMMIT,
    ROBOT_STATE_CONTROL,
    ROBOT_STATE_DEAD,
    ROBOT_STATE_PREPARE,
    ROBOT_STATE_WINNER
} from "./robot.js";

export default class Game {
    currentAction = 0

    constructor(randomSeedString, eventManager) {
        randomSeedString = randomSeedString ?? RandomGenerator.randomSeedString(32)

        let tickCounter = 0
        this._tickUpdate = () => eventManager.publish('tick', {tickCounter: tickCounter++})

        this.leftRobot = new Robot(
            ROBOT_SIDE_LEFT,
            createDeck(),
            new RandomGenerator(`${randomSeedString}-left`),
            this._leftRobotInfoUpdate = () => eventManager.publish('leftRobotInfoUpdate', this.leftRobot.robotInfo),
            this._leftCardsInfoUpdate = () => eventManager.publish('leftCardsInfoUpdate', this.leftRobot.cardsInfo),
        )
        this.rightRobot = new Robot(
            ROBOT_SIDE_RIGHT,
            createDeck(),
            new RandomGenerator(`${randomSeedString}-right`),
            this._rightRobotInfoUpdate = () => eventManager.publish('rightRobotInfoUpdate', this.rightRobot.robotInfo),
            this._rightCardsInfoUpdate = () => eventManager.publish('rightCardsInfoUpdate', this.rightRobot.cardsInfo),
        )
        this._actionPhaseInfoUpdate = (phase) => eventManager.publish(
            'actionPhaseInfoUpdate.' + phase,
            {leftRobotInfo: this.leftRobot.robotInfo, rightRobotInfo: this.rightRobot.robotInfo}
        )

        this._tickUpdate()
        this._leftRobotInfoUpdate()
        this._leftCardsInfoUpdate()
        this._rightRobotInfoUpdate()
        this._rightCardsInfoUpdate()
    }

    isOver() {
        if (this.leftRobot.state === ROBOT_STATE_DEAD && this.rightRobot.state === ROBOT_STATE_DEAD) {
            return true
        }

        return this.leftRobot.state === ROBOT_STATE_WINNER || this.rightRobot.state === ROBOT_STATE_WINNER
    }

    tick() {
        this._tickUpdate()

        if (this.isOver()) {
            console.debug("Game is already over")
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_CONTROL || this.rightRobot.state === ROBOT_STATE_CONTROL) {
            console.debug("Either robot is still waiting for input")
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_PREPARE && this.rightRobot.state === ROBOT_STATE_DEAD) {
            console.info("Left robot won!")
            this.leftRobot.state = ROBOT_STATE_WINNER
            this._leftRobotInfoUpdate()
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_DEAD && this.rightRobot.state === ROBOT_STATE_PREPARE) {
            console.info("Right robot won!")
            this.rightRobot.state = ROBOT_STATE_WINNER
            this._rightRobotInfoUpdate()
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_PREPARE && this.rightRobot.state === ROBOT_STATE_PREPARE) {
            console.info("Preparing for new round!")
            this.currentAction = 0
            this.leftRobot.drawHand()
            this.rightRobot.drawHand()
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_COMMIT && this.rightRobot.state === ROBOT_STATE_COMMIT) {
            console.info("Starting action!")
            this.leftRobot.state = ROBOT_STATE_ACTION
            this.rightRobot.state = ROBOT_STATE_ACTION
            this._leftRobotInfoUpdate()
            this._rightRobotInfoUpdate()
        }

        let actions = []

        if (this.leftRobot.state === ROBOT_STATE_ACTION) {
            if (this.leftRobot.actions[this.currentAction] !== undefined) {
                actions.push(this.leftRobot.actions[this.currentAction].getAction(this.leftRobot, this.rightRobot))
            } else {
                this.leftRobot.state = this.leftRobot.isDestroyed() ? ROBOT_STATE_DEAD : ROBOT_STATE_PREPARE
                this._leftRobotInfoUpdate()
            }
        }

        if (this.rightRobot.state === ROBOT_STATE_ACTION) {
            if (this.rightRobot.actions[this.currentAction] !== undefined) {
                actions.push(this.rightRobot.actions[this.currentAction].getAction(this.rightRobot, this.leftRobot))
            } else {
                this.rightRobot.state = this.rightRobot.isDestroyed() ? ROBOT_STATE_DEAD : ROBOT_STATE_PREPARE
                this._rightRobotInfoUpdate()
            }
        }

        if (this.leftRobot.state === ROBOT_STATE_ACTION || this.rightRobot.state === ROBOT_STATE_ACTION) {
            actions.forEach(action => action.prepare())
            actions.forEach(action => action.afterPrepare())
            this._actionPhaseInfoUpdate('prepare')

            actions.forEach(action => action.do())
            this._actionPhaseInfoUpdate('do')

            actions.forEach(action => action.cleanup())
            this._actionPhaseInfoUpdate('cleanup')

            this.currentAction++
        }
    }
}

