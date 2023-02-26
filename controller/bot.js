import RandomGenerator from "../utils/randomGenerator.js";
import {ROBOT_STATE_INPUT, ROBOT_STATE_DESTROYED, ROBOT_STATE_WINNER, ROBOT_SIDE_LEFT} from "../game/robot.js";
import Timer from "../utils/timer.js";

export default class Bot {
    /**
     * @param {Robot} robot
     * @param {function():Game} getGameCopyCallback
     * @param {?string} randomSeedString
     */
    constructor(robot, getGameCopyCallback, randomSeedString) {
        this._robot = robot
        this._getGameCopy = () => {
            if (this._gameCopy === undefined) {
                this._gameCopy = getGameCopyCallback()
            }
            return this._gameCopy.copy()
        }
        this._randomGenerator = new RandomGenerator(randomSeedString)
        this._timer = new Timer()
    }

    start() {
        this._timer.doPeriodically(() => {
            if (this._robot.state === ROBOT_STATE_INPUT && this._gameCopy === undefined) {
                this._getGameCopy()
                return
            }
            if (this._robot.state === ROBOT_STATE_INPUT) this._chooseBestActions()
            if (this._robot.state === ROBOT_STATE_WINNER || this._robot.state === ROBOT_STATE_DESTROYED) this.stop()
        }, 200, 0)
    }

    stop() {
        this._timer.clear()
    }

    _chooseBestActions() {
        const timeStart = Date.now()

        let thisActionSets = this._getAllPossibleActionSets(this._getThisRobot())
        let otherActionSets = this._getAllPossibleActionSets(this._getOtherRobot())

        console.log("Number of found possible action sets: ", thisActionSets.length)

        const passiveActionSet = [(robot) => robot.commit()]

        thisActionSets = thisActionSets.map(actionSet => ({
            actionSet,
            score: this._scoreGame(this._simulateGame(actionSet, passiveActionSet))
        })).sort((a, b) => b.score - a.score)


        const bestOtherActionSetWhenThisPassive = otherActionSets.map(otherActionSet => ({
            actionSet: otherActionSet,
            score: - this._scoreGame(this._simulateGame(passiveActionSet, otherActionSet))
        })).sort((a, b) => b.score - a.score)[0].actionSet
        const bestOtherActionSetWhenThisAssumesPassiveOpponent = otherActionSets.map(otherActionSet => ({
            actionSet: otherActionSet,
            score: - this._scoreGame(this._simulateGame(thisActionSets[0].actionSet, otherActionSet))
        })).sort((a, b) => b.score - a.score)[0].actionSet

        // Final score is based on how it performs against:
        // - passive opponent (already calculated in score)
        // - opponent assuming we will be passive
        // - opponent assuming we will be assuming they will be passive
        thisActionSets = thisActionSets.map(({actionSet, score}) => ({
            actionSet,
            score: score
                + this._scoreGame(this._simulateGame(actionSet, bestOtherActionSetWhenThisPassive))
                + this._scoreGame(this._simulateGame(actionSet, bestOtherActionSetWhenThisAssumesPassiveOpponent))
        })).sort((a, b) => b.score - a.score)

        console.log(`Choosing best course of action took ${Date.now() - timeStart}ms`)

        this._gameCopy = undefined
        thisActionSets[0].actionSet.forEach(action => action(this._robot))
    }

    _simulateGame(thisActionSet, otherActionSet) {
        return this._runWithDisabledConsole(() => {
            const simulatedGame = this._getGameCopy()
            thisActionSet.forEach(action => action(this._getThisRobot(simulatedGame)))
            otherActionSet.forEach(action => action(this._getOtherRobot(simulatedGame)))
            let safety = 0
            while (simulatedGame.isEvaluating()) {
                if (safety++ > 100) {
                    console.warn("Simulation is taking too long", simulatedGame, thisActionSet, otherActionSet)
                    return simulatedGame
                }
                simulatedGame.tick()
            }

            return simulatedGame
        })
    }

    _scoreGame(game) {
        return this._runWithDisabledConsole(() => {
            return this._scoreRobot(this._getThisRobot(game)) - this._scoreRobot(this._getOtherRobot(game))
        })
    }

    _scoreRobot(robot) {
        return this._runWithDisabledConsole(() => {
            if (robot.isDestroyed()) return 0

            // Basic score is total health
            let score = robot.head.health + robot.torso.health + robot.heatsink.health

            // Least healthy bodypart is most important, bonus for keeping above one-hit threshold
            const minHealth = Math.min(robot.head.health, robot.torso.health, robot.heatsink.health);
            score += minHealth
            if (minHealth > 30) score += 50
            if (minHealth > 10) score += 50

            // Bonus for effective blocking
            for (let position = 0; position < 10; position++) {
                const isBlocked = robot.getHandsBlockingAt(position).length > 0
                const blockingLowHealthBonus = Math.max(0, 40 - robot.getBodypartAt(position).health) / 2
                score += isBlocked ? blockingLowHealthBonus : 0
            }

            return score
        })
    }

    _getAllPossibleActionSets(robot) {
        return this._getPossibleActionSets(robot.actions.length, robot.handCards.length, 0, [])
            .map(actionSet => ({actionSet: actionSet, sort: this._randomGenerator.nextRandom()}))
            .sort((a, b) => a.sort - b.sort)
            .map(({actionSet}) => actionSet)
    }

    _getPossibleActionSets(remainingActionsCount, handCardsCount, actionIndex, usedHandCardIndexes) {
        const possibleActionSets = [[(robot) => robot.commit()]]

        if (remainingActionsCount <= 0) {
            return possibleActionSets
        }

        for (let handCardIndex = 0; handCardIndex < handCardsCount; handCardIndex++) {
            if (usedHandCardIndexes.indexOf(handCardIndex) !== -1) continue

            const nextPossibleActionSets = this._getPossibleActionSets(
                remainingActionsCount - 1,
                handCardsCount,
                actionIndex + 1,
                usedHandCardIndexes.concat([handCardIndex])
            )
            nextPossibleActionSets.forEach(nextPossibleActionSet => {
                possibleActionSets.push([
                    (robot) => robot.chooseAction(handCardIndex, actionIndex),
                ].concat(nextPossibleActionSet))
                possibleActionSets.push([
                    (robot) => robot.chooseAction(handCardIndex, actionIndex),
                    (robot) => robot.toggleActionHand(actionIndex),
                ].concat(nextPossibleActionSet))
            })
        }

        return possibleActionSets
    }

    _getThisRobot(game = this._getGameCopy()) {
        return this._robot.side === ROBOT_SIDE_LEFT ? game.leftRobot : game.rightRobot
    }

    _getOtherRobot(game = this._getGameCopy()) {
        return this._robot.side === ROBOT_SIDE_LEFT ? game.rightRobot : game.leftRobot
    }

    _runWithDisabledConsole(callback) {
        const originalConsole = console
        console = {
            ...console,
            debug: () => {},
            log: () => {},
            info: () => {},
        }

        const returnValue = callback()

        console = originalConsole

        return returnValue
    }
}