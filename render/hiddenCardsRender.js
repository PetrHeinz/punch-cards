import {ROBOT_STATE_COMMIT, ROBOT_STATE_CONTROL} from "../game/robot.js";
import CardsRender from "./cardsRender.js";

export default class HiddenCardsRender extends CardsRender {
    hiddenActions = false

    initAction(root, action) {
        const cardElement = super.initAction(root, action)
        if (this.hiddenActions) {
            cardElement.innerHTML = ""
        }
    }

    render(cardsInfo) {
        const newHiddenActions = cardsInfo.state === ROBOT_STATE_CONTROL || cardsInfo.state === ROBOT_STATE_COMMIT;

        if (newHiddenActions !== this.hiddenActions) {
            this._actionCardsCache.clear()
            this.hiddenActions = newHiddenActions
        }

        return super.render(cardsInfo)
    }

    _enrichHandCardsInfo(cardsInfo) {
        return cardsInfo
    }
}