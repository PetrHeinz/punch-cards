export default class RobotRender {
    constructor(root) {
        const robot = document.createElement('div')
        robot.classList.add('robot')

        this.head = this.initBodypart(robot, 'head')
        this.torso = this.initBodypart(robot, 'torso')
        this.heatsink = this.initBodypart(robot, 'heatsink')
        this.rightHand = this.initHand(robot, 'right')
        this.leftHand = this.initHand(robot, 'left')

        this.state = document.createElement('div')
        this.state.classList.add('state')
        robot.append(this.state)

        root.append(robot)
    }

    initBodypart(root, extraClass) {
        const bodypart = document.createElement('div')
        bodypart.classList.add('bodypart')
        bodypart.classList.add(extraClass)

        root.append(bodypart)

        return bodypart
    }

    initHand(root, extraClass) {
        const bodypart = document.createElement('div')
        bodypart.classList.add('bodypart')
        bodypart.classList.add('hand')
        bodypart.classList.add(extraClass)

        root.append(bodypart)

        return bodypart
    }

    render(robotInfo) {
        this.state.textContent = robotInfo.state
        this.head.textContent = robotInfo.head.health
        this.torso.textContent = robotInfo.torso.health
        this.heatsink.textContent = robotInfo.heatsink.health
        this.rightHand.style.setProperty('--up', 8 - robotInfo.rightHand.position + "px")
        this.rightHand.classList.toggle('blocking', robotInfo.rightHand.isBlocking)
        this.rightHand.classList.toggle('attacking', robotInfo.rightHand.isAttacking)
        this.rightHand.classList.toggle('blocked', robotInfo.rightHand.isBlocked)
        this.rightHand.classList.toggle('charged', robotInfo.rightHand.isCharged)
        this.leftHand.style.setProperty('--up', 8 - robotInfo.leftHand.position + "px")
        this.leftHand.classList.toggle('blocking', robotInfo.leftHand.isBlocking)
        this.leftHand.classList.toggle('attacking', robotInfo.leftHand.isAttacking)
        this.leftHand.classList.toggle('blocked', robotInfo.leftHand.isBlocked)
        this.leftHand.classList.toggle('charged', robotInfo.leftHand.isCharged)
    }
}