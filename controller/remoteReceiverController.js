export default class RemoteReceiverController {

    /**
     * @param {Robot} robot
     * @param {function(function(Object):void):void} listenerCallback
     */
    constructor(robot, listenerCallback) {
        this.robot = robot
        listenerCallback((data) => this.onAction(data))
    }

    /**
     * @param {RobotRender} robotRender
     */
    initialize(robotRender) {
    }

    afterRender() {
    }

    onAction(data) {
        if (data.side !== this.robot.side) return

        switch (data.action) {
            case "chooseAction":
                return this.robot.chooseAction(data.handCardIndex, data.actionIndex)
            case "swapActions":
                return this.robot.swapActions(data.firstActionIndex, data.secondActionIndex)
            case "discardAction":
                return this.robot.discardAction(data.actionIndex)
            case "toggleActionHand":
                return this.robot.toggleActionHand(data.actionIndex)
            case "commit":
                return this.robot.commit()
            default:
                throw "Unknown action: " + data.action
        }
    }
}