import {createDeck} from "./cards.js";
import ChangeCache from "../utils/changeCache.js";
import RandomGenerator from "../utils/randomGenerator.js";
import Robot, {
    ROBOT_SIDE_LEFT,
    ROBOT_SIDE_RIGHT,
    ROBOT_STATE_ACTION,
    ROBOT_STATE_COMMIT,
    ROBOT_STATE_INPUT,
    ROBOT_STATE_DESTROYED,
    ROBOT_STATE_PREPARING,
    ROBOT_STATE_WINNER
} from "./robot.js";

export default class Game {
    currentAction = 0
    _tickCounter = 0

    constructor(gameOptions, eventManager) {
        gameOptions = {
            randomSeedString: RandomGenerator.randomSeedString(32),
            ...gameOptions,
        }
        this.eventManager = eventManager

        this._leftRobotInfoCache = new ChangeCache()
        this._leftCardsInfoCache = new ChangeCache()
        this._rightRobotInfoCache = new ChangeCache()
        this._rightCardsInfoCache = new ChangeCache()

        this.leftRobot = new Robot(
            ROBOT_SIDE_LEFT,
            createDeck(),
            new RandomGenerator(`${gameOptions.randomSeedString}-left`),
            () => this._leftRobotUpdate(),
        )
        this.rightRobot = new Robot(
            ROBOT_SIDE_RIGHT,
            createDeck(),
            new RandomGenerator(`${gameOptions.randomSeedString}-right`),
            () => this._rightRobotUpdate(),
        )

        this._tickUpdate()
        this._robotsUpdate()
    }

    _tickUpdate() {
        this.eventManager.publish('tick', {tickCounter: this._tickCounter++})
    }

    _robotsUpdate() {
        this._leftRobotUpdate()
        this._rightRobotUpdate()
    }

    _leftRobotUpdate() {
        this._leftCardsInfoCache.ifChanged(this.leftRobot.cardsInfo, () => {
            this.eventManager.publish('leftCardsInfoUpdate', this.leftRobot.cardsInfo)
        })
        this._leftRobotInfoCache.ifChanged(this.leftRobot.robotInfo, () => {
            this.eventManager.publish('leftRobotInfoUpdate', this.leftRobot.robotInfo)
        })
    }

    _rightRobotUpdate() {
        this._rightCardsInfoCache.ifChanged(this.rightRobot.cardsInfo, () => {
            this.eventManager.publish('rightCardsInfoUpdate', this.rightRobot.cardsInfo)
        })
        this._rightRobotInfoCache.ifChanged(this.rightRobot.robotInfo, () => {
            this.eventManager.publish('rightRobotInfoUpdate', this.rightRobot.robotInfo)
        })
    }

    _actionPhaseInfoUpdate(phase) {
        this.eventManager.publish(
            'actionPhaseInfoUpdate.' + phase,
            {leftRobotInfo: this.leftRobot.robotInfo, rightRobotInfo: this.rightRobot.robotInfo}
        )
    }

    clearUpdateCache()
    {
        this._leftRobotInfoCache.clear()
        this._leftCardsInfoCache.clear()
        this._rightRobotInfoCache.clear()
        this._rightCardsInfoCache.clear()
    }

    isOver() {
        if (this.leftRobot.state === ROBOT_STATE_DESTROYED && this.rightRobot.state === ROBOT_STATE_DESTROYED) {
            return true
        }

        return this.leftRobot.state === ROBOT_STATE_WINNER || this.rightRobot.state === ROBOT_STATE_WINNER
    }

    tick() {
        this._tickUpdate()
        this._robotsUpdate()

        if (this.isOver()) {
            console.debug("Game is already over")
            return
        }

        this.leftRobot.tick()
        this.rightRobot.tick()

        if (this.rightRobot.state === ROBOT_STATE_DESTROYED) {
            console.info("Left robot won!")
            this.leftRobot.state = ROBOT_STATE_WINNER
            this._leftRobotUpdate()
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_DESTROYED) {
            console.info("Right robot won!")
            this.rightRobot.state = ROBOT_STATE_WINNER
            this._rightRobotUpdate()
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_INPUT || this.rightRobot.state === ROBOT_STATE_INPUT) {
            console.debug("Either robot is still waiting for input")
            return
        }

        if (this.leftRobot.state === ROBOT_STATE_PREPARING && this.rightRobot.state === ROBOT_STATE_PREPARING) {
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
            this._robotsUpdate()
        }

        let actions = []

        if (this.leftRobot.state === ROBOT_STATE_ACTION) {
            if (this.leftRobot.actions[this.currentAction] !== undefined) {
                actions.push(this.leftRobot.actions[this.currentAction].getAction(this.leftRobot, this.rightRobot))
            } else {
                this.leftRobot.state = this.leftRobot.isDestroyed() ? ROBOT_STATE_DESTROYED : ROBOT_STATE_PREPARING
                this._leftRobotUpdate()
            }
        }

        if (this.rightRobot.state === ROBOT_STATE_ACTION) {
            if (this.rightRobot.actions[this.currentAction] !== undefined) {
                actions.push(this.rightRobot.actions[this.currentAction].getAction(this.rightRobot, this.leftRobot))
            } else {
                this.rightRobot.state = this.rightRobot.isDestroyed() ? ROBOT_STATE_DESTROYED : ROBOT_STATE_PREPARING
                this._rightRobotUpdate()
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

