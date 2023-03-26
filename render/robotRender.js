import TickRender from "./tickRender.js";

export default class RobotRender {
    constructor(root, tickTimeout) {
        this.tickTimeout = tickTimeout

        const robot = document.createElement('div')
        robot.classList.add('robot')

        this.head = this.initBodypart(robot, 'head')
        this.torso = this.initBodypart(robot, 'torso')
        this.heatsink = this.initBodypart(robot, 'heatsink')
        this.rightHand = this.initHand(robot, 'right')
        this.leftHand = this.initHand(robot, 'left')

        this.tickRender = new TickRender(this.tickTimeout)
        this.tickRender.appendTo(this.torso)

        this.state = document.createElement('div')
        this.state.classList.add('state')
        robot.append(this.state)

        root.append(robot)

        Object.freeze(this)
    }

    initBodypart(root, extraClass) {
        const bodypart = document.createElement('div')
        bodypart.classList.add('bodypart', extraClass)
        bodypart.style.transitionDuration = `${.45 * this.tickTimeout}ms`

        const health = document.createElement('div')
        health.classList.add('health')
        bodypart.append(health)

        const maxHealth = document.createElement('div')
        maxHealth.classList.add('max-health')
        bodypart.append(maxHealth)

        root.append(bodypart)

        return bodypart
    }

    initHand(root, extraClass) {
        const hand = document.createElement('div')
        hand.classList.add('bodypart', 'hand', extraClass)
        hand.style.transitionDuration = `${.45 * this.tickTimeout}ms`

        root.append(hand)

        return hand
    }

    render(robotInfo) {
        this.state.textContent = robotInfo.state
        this._renderBodypartChange(this.head, robotInfo.head)
        this._renderBodypartChange(this.torso, robotInfo.torso)
        this._renderBodypartChange(this.heatsink, robotInfo.heatsink)
        this.tickRender.renderTimeToInput(robotInfo.timeToInput, robotInfo.state)
        this.rightHand.style.setProperty('--up', 8 - robotInfo.rightHand.position)
        this.rightHand.classList.toggle('blocking', robotInfo.rightHand.isBlocking)
        this.rightHand.classList.toggle('attacking', robotInfo.rightHand.isAttacking)
        this.rightHand.classList.toggle('blocked', robotInfo.rightHand.isBlocked)
        this.rightHand.classList.toggle('charged', robotInfo.rightHand.isCharged)
        this.leftHand.style.setProperty('--up', 8 - robotInfo.leftHand.position)
        this.leftHand.classList.toggle('blocking', robotInfo.leftHand.isBlocking)
        this.leftHand.classList.toggle('attacking', robotInfo.leftHand.isAttacking)
        this.leftHand.classList.toggle('blocked', robotInfo.leftHand.isBlocked)
        this.leftHand.classList.toggle('charged', robotInfo.leftHand.isCharged)
    }

    _renderBodypartChange(element, bodypartInfo) {
        if (element.querySelector(".health").textContent !== ""){
            const previousHealth = parseFloat(element.querySelector(".health").textContent)
            const healthChange = bodypartInfo.health - previousHealth
            if (healthChange !== 0) {
                const newElement = document.createElement('div')
                newElement.classList.add('health-change')
                newElement.textContent = `${healthChange > 0 ? '+' : '-'} ${Math.abs(healthChange)}`
                element.append(newElement)
                setTimeout(() => newElement.remove(), this.tickTimeout)
            }
        }

        element.querySelector(".health").textContent = bodypartInfo.health
        element.querySelector(".max-health").textContent = bodypartInfo.maxHealth
    }
}
