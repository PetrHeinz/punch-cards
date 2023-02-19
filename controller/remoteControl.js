export default class RemoteControl {

    constructor(side, serverConnection) {
        this.side = side
        this.serverConnection = serverConnection
    }

    chooseAction(handCardIndex, actionIndex) {
        this._sendAction({action: "chooseAction", handCardIndex, actionIndex})
    }

    swapActions(firstActionIndex, secondActionIndex) {
        this._sendAction({action: "swapActions", firstActionIndex, secondActionIndex})
    }

    toggleActionHand(actionIndex) {
        this._sendAction({action: "toggleActionHand", actionIndex})
    }

    discardAction(actionIndex) {
        this._sendAction({action: "discardAction", actionIndex})
    }

    commit() {
        this._sendAction({action: "commit"})
    }

    _sendAction(data) {
        data.side = this.side
        this.serverConnection.send(data)
    }

    static createReceiver(robot) {
        return (data) => {
            console.log(robot, data)

            if (data.side !== robot.side) return

            switch (data.action) {
                case "chooseAction":
                    return robot.chooseAction(data.handCardIndex, data.actionIndex)
                case "swapActions":
                    return robot.swapActions(data.firstActionIndex, data.secondActionIndex)
                case "discardAction":
                    return robot.discardAction(data.actionIndex)
                case "toggleActionHand":
                    return robot.toggleActionHand(data.actionIndex)
                case "commit":
                    return robot.commit()
                default:
                    throw "Unknown action: " + data.action
            }
        }
    }
}