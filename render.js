class GameRender {
    constructor(root, leftController, rightController) {
        if (root.children.length > 0) {
            throw "Root element is not empty"
        }
        const game = document.createElement('div')
        game.classList.add('game')

        this.menu = document.createElement("div")
        this.menu.classList.add("menu-upper")
        game.append(this.menu)

        this.leftRobot = new RobotRender(game, 'left', leftController)
        this.rightRobot = new RobotRender(game, 'right', rightController)

        root.append(game)
    }

    addMenuButton(text, callback) {
        let button = document.createElement("div")
        button.classList.add("clickable")
        button.textContent = text
        button.addEventListener("click", () => callback())

        this.menu.append(button)
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

class RobotRender {
    constructor(root, extraClass, controller) {
        this.controller = controller

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

        this.state = document.createElement('div')
        this.state.classList.add('state')
        robot.append(this.state)

        side.append(robot)

        this.actionCards = document.createElement('div')
        this.actionCards.classList.add('actions')
        side.append(this.actionCards)

        this.handCards = document.createElement('div')
        this.handCards.classList.add('cards')
        side.append(this.handCards)

        this.readyButton = document.createElement('div')
        this.readyButton.classList.add('button')
        this.readyButton.textContent = 'Ready'
        side.append(this.readyButton)

        root.append(side)

        this.controller.initialize(this)
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

    initCard(root, card, renderHandToggle) {
        const cardElement = document.createElement('div')
        cardElement.classList.add('card')

        if (card !== null) {
            cardElement.append(card.icon)
            cardElement.append(document.createElement('br'))
            cardElement.append(card.name)
            if (renderHandToggle) {
                let handElement = document.createElement("div")
                handElement.classList.add("hand-toggle")
                handElement.classList.add(card.hand === ROBOT_HAND_RIGHT ? "right" : "left")
                handElement.textContent = card.hand
                cardElement.append(handElement)
            }
        }

        root.append(cardElement)

        return cardElement
    }

    /**
     * @param {Robot} robot 
     */
    render(robot) {
        this.renderRobot(robot);

        this._actionCardsCache.ifChanged(robot.actionCards, () => {
            this.actionCards.innerHTML = ''
            robot.actionCards.forEach((card) => this.initCard(this.actionCards, card, true))
        })
        this._handCardsCache.ifChanged(robot.handCards, () => {
            this.handCards.innerHTML = ''
            robot.handCards.forEach((card) => this.initCard(this.handCards, card))
        })

        this.readyButton.classList.toggle("pushed", robot.state !== ROBOT_STATE_CONTROL)

        this.controller.afterRender()
    }

    renderRobot(robot) {
        this.robot = robot

        this.state.textContent = robot.state
        this.head.textContent = robot.head.health
        this.torso.textContent = robot.torso.health
        this.heatsink.textContent = robot.heatsink.health
        this.rightHand.style = '--up: ' + (8 - robot.rightHand.position)
        this.rightHand.classList.toggle('blocking', robot.rightHand.isBlocking)
        this.rightHand.classList.toggle('attacking', robot.rightHand.isAttacking)
        this.rightHand.classList.toggle('blocked', robot.rightHand.isBlocked)
        this.rightHand.classList.toggle('charged', robot.rightHand.isCharged)
        this.leftHand.style = '--up: ' + (8 - robot.leftHand.position)
        this.leftHand.classList.toggle('blocking', robot.leftHand.isBlocking)
        this.leftHand.classList.toggle('attacking', robot.leftHand.isAttacking)
        this.leftHand.classList.toggle('blocked', robot.leftHand.isBlocked)
        this.leftHand.classList.toggle('charged', robot.leftHand.isCharged)
    }
}

ROBOT_CARDS_ACTION = "ACTION"
ROBOT_CARDS_HAND = "HAND"
ROBOT_CARDS_NONE = "NONE"

class DirectRobotController {
    selected = ROBOT_CARDS_NONE
    selectedIndex = 0

    /**
     * @param {Robot} robot
     */
    constructor(robot) {
        this.robot = robot
    }

    /**
     * @param {RobotRender} robotRender
     */
    initialize(robotRender) {
        if (this.render !== undefined) throw "This controller has already been initialized"
        this.render = robotRender

        this.render.actionCards.addEventListener("click", (event) => {
            if (this.robot.state !== ROBOT_STATE_CONTROL) return
            if (event.target === this.render.actionCards) return

            const actionCardIndex = getChildIndex(this.render.actionCards, event.target)
            if (event.target.classList.contains("hand-toggle")) {
                this.robot.toggleActionHand(actionCardIndex)
                this.render.render(this.robot)
                return
            }

            if (this.selected === ROBOT_CARDS_HAND) {
                this.robot.chooseAction(this.selectedIndex, actionCardIndex)
                this.render.render(this.robot)
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (actionCardIndex !== this.selectedIndex) {
                    this.robot.swapActions(actionCardIndex, this.selectedIndex)
                    this.render.render(this.robot)
                }
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_ACTION, actionCardIndex)
        })

        this.render.handCards.addEventListener("click", (event) => {
            if (this.robot.state !== ROBOT_STATE_CONTROL) return
            if (event.target === this.render.handCards) return

            const handCardIndex = getChildIndex(this.render.handCards, event.target)
            if (this.selected === ROBOT_CARDS_ACTION) {
                if (this.robot.actionCards[this.selectedIndex] === this.robot.handCards[handCardIndex]) {
                    this.robot.discardAction(this.selectedIndex)
                } else {
                    this.robot.chooseAction(handCardIndex, this.selectedIndex)
                }
                this.render.render(this.robot)
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            if (this.selected === ROBOT_CARDS_HAND && handCardIndex === this.selectedIndex) {
                this.selectCard(ROBOT_CARDS_NONE)
                return
            }
            this.selectCard(ROBOT_CARDS_HAND, handCardIndex)
        })

        this.render.readyButton.addEventListener("click", () => {
            if (this.robot.state !== ROBOT_STATE_CONTROL) return
            this.robot.commit()
            this.render.render(this.robot)
            this.selectCard(ROBOT_CARDS_NONE)
        })
    }

    afterRender() {
        this.selectCard(this.selected, this.selectedIndex)

        for (const handCardIndex in this.robot.handCards) {
            const handCardUsed = this.robot.actionCards.indexOf(this.robot.handCards[handCardIndex]) >= 0
            this.render.handCards.children[handCardIndex].classList.toggle("used", handCardUsed)
        }

        this.render.actionCards.style.cursor = this.robot.state === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.render.handCards.style.cursor = this.robot.state === ROBOT_STATE_CONTROL ? "pointer" : ""
        this.render.readyButton.classList.toggle("clickable", this.robot.state === ROBOT_STATE_CONTROL)
    }

    selectCard(selected, selectedIndex) {
        this.render.actionCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        this.render.handCards.querySelectorAll(".selected")
            .forEach(e => e.classList.remove("selected"))
        if (selected === ROBOT_CARDS_ACTION) {
            this.render.actionCards.children[selectedIndex].classList.add("selected")
        }
        if (selected === ROBOT_CARDS_HAND) {
            this.render.handCards.children[selectedIndex].classList.add("selected")
        }
        this.selected = selected
        if (selectedIndex !== undefined) {
            this.selectedIndex = selectedIndex
        }
    }
}

class RandobotController {
    currentActionIndex = 0
    possibleHandCardIndexes = []
    currentToggleIndex = 0
    currentPhase = 0

    /**
     * @param {Robot} robot
     * @param {?string} randomSeedString
     */
    constructor(robot, randomSeedString) {
        this.robot = robot
        this._randomGenerator = new RandomGenerator(randomSeedString);
    }

    /**
     * @param {RobotRender} robotRender
     */
    initialize(robotRender) {
        if (this.render !== undefined) throw "This controller has already been initialized"
        this.render = robotRender

        const interval = setInterval(() => {
            if (this.robot.state === ROBOT_STATE_CONTROL) this.doAction()
            if (this.robot.state === ROBOT_STATE_ACTION) this.render.actionCards.style.visibility = ""
            if (this.robot.state === ROBOT_STATE_WINNER || this.robot.state === ROBOT_STATE_DEAD) clearInterval(interval)
        }, 200)
    }

    afterRender() {
    }

    doAction() {
        const phases = [
            () => {
                this.render.actionCards.style.visibility = "hidden"
                this.possibleHandCardIndexes = [...this.robot.actionCards.keys()]

                return true
            },
            () => {
                this.possibleHandCardIndexes = this.possibleHandCardIndexes
                    .map(i => ({ i, sort: this._randomGenerator.nextRandom() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ i }) => i)

                this.robot.chooseAction(this.possibleHandCardIndexes.pop(), this.currentActionIndex++)

                return this.possibleHandCardIndexes.length === 0 || this.currentActionIndex >= this.robot.actionCards.length
            },
            () => {
                if (this._randomGenerator.nextRandom() > .5) {
                    this.robot.toggleActionHand(this.currentToggleIndex)
                }
                this.currentToggleIndex++

                return this.currentToggleIndex >= this.robot.actionCards.length
            },
            () => {
                this.robot.commit()
                this.currentActionIndex = 0
                this.currentToggleIndex = 0
                this.currentPhase = 0

                return false
            },
        ]

        const hasFinishedPhase = phases[this.currentPhase]()

        if (hasFinishedPhase) this.currentPhase++

        this.render.render(this.robot)
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
