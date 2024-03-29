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
import EventManager from "../utils/events.js";

export default class Game {
    currentAction = 0
    _tickCounter = 0

    constructor(gameOptions, eventManager) {
        this.eventManager = eventManager

        gameOptions = {
            randomSeedString: RandomGenerator.randomSeedString(32),
            robotOptions: {},
            leftRobotOptions: {},
            rightRobotOptions: {},
            ...gameOptions,
        }

        this._leftRobotInfoCache = new ChangeCache()
        this._leftCardsInfoCache = new ChangeCache()
        this._rightRobotInfoCache = new ChangeCache()
        this._rightCardsInfoCache = new ChangeCache()

        this.leftRobot = new Robot(
            ROBOT_SIDE_LEFT,
            {...gameOptions.robotOptions, ...gameOptions.leftRobotOptions},
            new RandomGenerator(`${gameOptions.randomSeedString}-left`),
            () => this._leftRobotUpdate(),
        )
        this.rightRobot = new Robot(
            ROBOT_SIDE_RIGHT,
            {...gameOptions.robotOptions, ...gameOptions.rightRobotOptions},
            new RandomGenerator(`${gameOptions.randomSeedString}-right`),
            () => this._rightRobotUpdate(),
        )

        window.game = this

        this._tickUpdate()
        this._robotsUpdate()
    }

    copy(safe = false) {
        const isLeftInput = this.leftRobot.state === ROBOT_STATE_INPUT;
        const isRightInput = this.rightRobot.state === ROBOT_STATE_INPUT;
        if (safe && !(isLeftInput && isRightInput || !isLeftInput && !isRightInput)) {
            throw "Game state is inconsistent, cannot revert current actions and one robot may use that information"
        }
        return Object.assign(Object.create(Game.prototype),{
            ...this,
            eventManager: new EventManager(),
            _tickUpdate: () => {},
            _robotsUpdate: () => {},
            _leftRobotUpdate: () => {},
            _rightRobotUpdate: () => {},
            _actionPhaseInfoUpdate: () => {},
            leftRobot: this.leftRobot.copy(safe),
            rightRobot: this.rightRobot.copy(safe),
        })
    }

    _tickUpdate() {
        const bothRobotsCommitted = this.leftRobot.state === ROBOT_STATE_COMMIT && this.rightRobot.state === ROBOT_STATE_COMMIT
        const anyRobotInAction = this.leftRobot.state === ROBOT_STATE_ACTION || this.rightRobot.state === ROBOT_STATE_ACTION

        this.eventManager.publish('tick', {
            currentAction: bothRobotsCommitted || anyRobotInAction ? this.currentAction : -1,
            tickCounter: this._tickCounter++
        })
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

    isWaitingForInput() {
        return this.leftRobot.state === ROBOT_STATE_INPUT || this.rightRobot.state === ROBOT_STATE_INPUT
    }

    isEvaluating() {
        return !this.isOver() && !this.isWaitingForInput()
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

        if (this.isWaitingForInput()) {
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
            actions.forEach(action => action.selfPrepare())
            actions.forEach(action => action.otherPrepare())
            this._actionPhaseInfoUpdate('prepare')

            actions.forEach(action => action.selfDo())
            actions.forEach(action => action.otherDo())
            this._actionPhaseInfoUpdate('do')

            actions.forEach(action => action.selfCleanup())
            this._actionPhaseInfoUpdate('cleanup')

            this.currentAction++
        }
    }
}

