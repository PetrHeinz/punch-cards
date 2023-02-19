export default class Timer {
    timeouts = []
    intervals = []

    doInSequence(everyMilliseconds, ...callbacks) {
        let counter = 0
        callbacks.forEach(callback => this.doAfter(callback, counter++ * everyMilliseconds))
    }

    doPeriodically(callback, everyMilliseconds, afterMilliseconds = everyMilliseconds) {
        this.doAfter(() => {
            callback()
            this.intervals.push(setInterval(callback, everyMilliseconds))
        }, afterMilliseconds)
    }

    doAfter(callback, afterMilliseconds) {
        this.timeouts.push(setTimeout(callback, afterMilliseconds))
    }

    clear() {
        this.timeouts.forEach(timeout => clearTimeout(timeout))
        this.timeouts = []
        this.intervals.forEach(interval => clearTimeout(interval))
        this.intervals = []
    }
}
