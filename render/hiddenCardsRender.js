import {ROBOT_STATE_COMMIT, ROBOT_STATE_INPUT} from "../game/robot.js";
import CardsRender from "./cardsRender.js";

export default class HiddenCardsRender extends CardsRender {
    vars = {
        hiddenActions: false,
    }

    initAction(root, action) {
        const cardElement = super.initAction(root, action)
        if (this.vars.hiddenActions) {
            cardElement.innerHTML = ""
        }
    }

    render(cardsInfo) {
        const newHiddenActions = cardsInfo.state === ROBOT_STATE_INPUT || cardsInfo.state === ROBOT_STATE_COMMIT;

        if (newHiddenActions !== this.vars.hiddenActions) {
            this._actionCardsCache.clear()
            this.vars.hiddenActions = newHiddenActions
        }

        return super.render(cardsInfo)
    }

    _enrichHandCardsInfo(cardsInfo) {
        return cardsInfo
    }
}