class GameRender {
    constructor(root) {
        if (root.children.length > 0) {
            throw "Root element is not empty"
        }
        const game = document.createElement('div')
        game.classList.add('game')

        this.leftRobot = new RobotRender(game, 'left')
        this.rightRobot = new RobotRender(game, 'right')

        root.append(game)
    }

    /**
     * @param {Game} robot 
     */
    render(game) {
        this.rightRobot.render(game.rightRobot)
        this.leftRobot.render(game.leftRobot)
    }
}

class RobotRender {
    constructor(root, extraClass) {
        const side = document.createElement('div')
        side.classList.add('side')
        side.classList.add(extraClass)

        const robot = document.createElement('div')
        robot.classList.add('robot')

        this.head = this.initBodypart(robot, 'head')
        this.torso = this.initBodypart(robot, 'torso')
        this.heatsink = this.initBodypart(robot, 'heatsink')
        this.rightHand = this.initHand(robot, 'right')
        this.leftHand = this.initHand(robot, 'left')

        side.append(robot)

        this.actions = document.createElement('div')
        this.actions.classList.add('actions')
        side.append(this.actions)

        this.cards = document.createElement('div')
        this.cards.classList.add('cards')
        side.append(this.cards)

        this.readyButton = document.createElement('div')
        this.readyButton.classList.add('button')
        this.readyButton.textContent = 'Ready'
        side.append(this.readyButton)

        root.append(side)
    }

    initBodypart(root, extraClass) {
        const bodypart = document.createElement('div')
        bodypart.classList.add('bodypart')
        bodypart.classList.add(extraClass)
        bodypart.textContent = 'N/A'

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

    createCard(card) {
        const cardElement = document.createElement('div')
        cardElement.classList.add('card')

        if (card !== null) {
            cardElement.append(card.icon)
            cardElement.append(document.createElement('br'))
            cardElement.append(card.name)
        }

        return cardElement
    }

    /**
     * @param {Robot} robot 
     */
    render(robot) {
        this.head.textContent = robot.head.health
        this.torso.textContent = robot.torso.health
        this.heatsink.textContent = robot.heatsink.health
        this.rightHand.style = '--up: ' + (8 - robot.rightHand.position)
        this.rightHand.classList.add('blocking')
        this.leftHand.style = '--up: ' + (8 - robot.leftHand.position)
        this.leftHand.classList.add('blocking')

        this.actions.innerHTML = ''
        robot.actions.forEach((card) => this.actions.append(this.createCard(card)))
        this.actions.append()

        this.cards.innerHTML = ''
        robot.handCards.forEach((card) => this.cards.append(this.createCard(card)))
        this.cards.append()
    }
}
