import Timer from "../utils/timer.js";
import {ROBOT_STATE_INPUT} from "../game/robot.js";

export default class TickRender {
    constructor(tickTimeout) {
        this._tickTimeout = tickTimeout

        this._tick = document.createElement('div')
        this._tick.classList.add('tick')

        this._hand = document.createElement('div')
        this._hand.classList.add('hand')
        this._hand.style.transitionDuration = `${this._tickTimeout}ms`
        this._tick.append(this._hand)

        this._tickCount = document.createElement('div')
        this._tickCount.classList.add('count')
        this._tick.append(this._tickCount)

        this._timeToInput = document.createElement('div')
        this._timeToInput.classList.add('time-to-input')
        this._tick.append(this._timeToInput)

        this._timer = new Timer()
    }

    renderTick(tickCounter) {
        if (tickCounter === 0) return

        this._tickCount.textContent = tickCounter
        this._timer.clear()
        this._hand.classList.remove("ticking")
        this._timer.doAfter(() => this._hand.classList.add("ticking"), 10)
        this._timer.doAfter(() => this._hand.classList.remove("ticking"), this._tickTimeout)
    }

    renderTimeToInput(timeToInput, state) {
        this._timeToInput.classList.toggle("active", state === ROBOT_STATE_INPUT)
        this._timeToInput.textContent = timeToInput
    }

    appendTo(root) {
        root.append(this._tick)
    }
}

