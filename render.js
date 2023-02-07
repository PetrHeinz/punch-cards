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
     * @param {Game} game
     */
    render(game) {
        this.rightRobot.render(game.rightRobot)
        this.leftRobot.render(game.leftRobot)
    }

    renderRobots(game) {
        this.rightRobot.renderRobot(game.rightRobot)
        this.leftRobot.renderRobot(game.leftRobot)
    }
}

ROBOT_CARDS_ACTION = "ACTION"
ROBOT_CARDS_HAND = "HAND"
ROBOT_CARDS_NONE = "NONE"

class RobotRender {
    selected = ROBOT_CARDS_NONE
    selectedIndex = 0

    constructor(root, extraClass) {
        this._actionCardsCache = new ChangeCache()
        this._handCardsCache = new ChangeCache()

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

        this.actionCards = document.createElement('div')
        this.actionCards.classList.add('actions')
        this.actionCards.addEventListener("click", (event) => {
            event.preventDefault()
            if (event.target === this.actionCards) return

            const actionCardIndex = getChildIndex(this.actionCards, event.target)
            if (event.target.classList.contains("hand-toggle")) {
                this.robot.toggleActionHand(actionCardIndex)
                this.render(this.robot)
                return
            }

            if (this.selected === ROBOT_CARDS_HAND) {
                this.robot.chooseAction(this.selectedIndex, actionCardIndex)
                this.render(this.robot)
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_ACTION && actionCardIndex === this.selectedIndex) {
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_ACTION, actionCardIndex)
        })
        side.append(this.actionCards)

        this.handCards = document.createElement('div')
        this.handCards.classList.add('cards')
        this.handCards.addEventListener("click", (event) => {
            event.preventDefault()
            if (event.target === this.handCards) return

            const handCardIndex = getChildIndex(this.handCards, event.target)
            if (this.selected === ROBOT_CARDS_ACTION) {
                this.robot.chooseAction(handCardIndex, this.selectedIndex)
                this.render(this.robot)
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_HAND && handCardIndex === this.selectedIndex) {
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_HAND, handCardIndex)
        })
        side.append(this.handCards)

        this.readyButton = document.createElement('div')
        this.readyButton.classList.add('button')
        this.readyButton.textContent = 'Ready'
        this.readyButton.addEventListener("click", () => {
            this.robot.commit()
            this.render(this.robot)
            this.selectCard(ROBOT_CARDS_NONE)
        })
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

    createCard(card, cardType) {
        const cardElement = document.createElement('div')
        cardElement.classList.add('card')

        if (card !== null) {
            cardElement.append(card.icon)
            cardElement.append(document.createElement('br'))
            cardElement.append(card.name)
            if (cardType === ROBOT_CARDS_ACTION) {
                let handElement = document.createElement("div")
                handElement.classList.add("hand-toggle")
                handElement.classList.add(card.hand === ROBOT_HAND_RIGHT ? "right" : "left")
                handElement.textContent = card.hand
                cardElement.append(handElement)
            }
        }

        return cardElement
    }

    /**
     * @param {Robot} robot 
     */
    render(robot) {
        this.renderRobot(robot);

        this._actionCardsCache.ifChanged(robot.actionCards, () => {
            this.actionCards.innerHTML = ''
            robot.actionCards.forEach((card) => this.actionCards.append(this.createCard(card, ROBOT_CARDS_ACTION)))
        })
        this._handCardsCache.ifChanged(robot.handCards, () => {
            this.handCards.innerHTML = ''
            robot.handCards.forEach((card) => this.handCards.append(this.createCard(card, ROBOT_CARDS_HAND)))
        })

        this.readyButton.style.display = robot.state === ROBOT_STATE_CONTROL ? "" : "none"

        this.selectCard(this.selected, this.selectedIndex)
    }

    renderRobot(robot) {
        this.robot = robot

        this.head.textContent = robot.head.health
        this.torso.textContent = robot.torso.health
        this.heatsink.textContent = robot.heatsink.health
        this.rightHand.style = '--up: ' + (8 - robot.rightHand.position)
        this.rightHand.classList.toggle('blocking', robot.rightHand.isBlocking)
        this.rightHand.classList.toggle('attacking', robot.rightHand.isAttacking)
        this.rightHand.classList.toggle('blocked', robot.rightHand.isBlocked)
        this.leftHand.style = '--up: ' + (8 - robot.leftHand.position)
        this.leftHand.classList.toggle('blocking', robot.leftHand.isBlocking)
        this.leftHand.classList.toggle('attacking', robot.leftHand.isAttacking)
        this.leftHand.classList.toggle('blocked', robot.leftHand.isBlocked)
    }

    selectCard(selected, selectedIndex) {
        this.actionCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        this.handCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        if (selected === ROBOT_CARDS_ACTION) {
            this.actionCards.children[selectedIndex].classList.add("selected")
        }
        if (selected === ROBOT_CARDS_HAND) {
            this.handCards.children[selectedIndex].classList.add("selected")
        }
        this.selected = selected
        if (selectedIndex !== undefined) {
            this.selectedIndex = selectedIndex
        }
    }
}

class ChangeCache {
    constructor(object) {
        this.lastJson = object !== undefined ? JSON.stringify(object) : ''
    }
    ifChanged(object, callback) {
        const json = JSON.stringify(object)
        if (json !== this.lastJson) {
            callback()
        }
        this.lastJson = json
    }
}

function getChildIndex(element, childElement) {
    for (const childIndex in element.children) {
        if (element.children[childIndex] === childElement) {
            return childIndex
        }
    }
    return getChildIndex(element, childElement.parentElement)
}
