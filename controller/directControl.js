export default class DirectControl {
    /**
     * @param {Robot} robot
     */
    constructor(robot) {
        this.robot = robot
    }

    chooseAction(handCardIndex, actionIndex) {
        this.robot.chooseAction(parseInt(handCardIndex), parseInt(actionIndex))
    }

    swapActions(firstActionIndex, secondActionIndex) {
        this.robot.swapActions(parseInt(firstActionIndex), parseInt(secondActionIndex))
    }

    toggleActionHand(actionIndex) {
        this.robot.toggleActionHand(parseInt(actionIndex))
    }

    discardAction(actionIndex) {
        this.robot.discardAction(parseInt(actionIndex))
    }

    commit() {
        this.robot.commit()
    }
}