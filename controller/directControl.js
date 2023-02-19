export default class DirectControl {
    /**
     * @param {Robot} robot
     */
    constructor(robot) {
        this.robot = robot
    }

    chooseAction(handCardIndex, actionIndex) {
        this.robot.chooseAction(handCardIndex, actionIndex)
    }

    swapActions(firstActionIndex, secondActionIndex) {
        this.robot.swapActions(firstActionIndex, secondActionIndex)
    }

    toggleActionHand(actionIndex) {
        this.robot.toggleActionHand(actionIndex)
    }

    discardAction(actionIndex) {
        this.robot.discardAction(actionIndex)
    }

    commit() {
        this.robot.commit()
    }
}