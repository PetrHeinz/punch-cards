import GameRender, {DirectRobotController, RandobotController} from "./render.js";
import Game from "./game.js";

export default class Application {
    intervals = []
    randomSeedString = "punch-cards"
    controllers = [
        {
            name: 'Direct control',
            create: (robot) => new DirectRobotController(robot),
        },
        {
            name: 'Randobot',
            create: (robot) => new RandobotController(robot, this.randomSeedString),
        },
    ]
    leftControllerIndex = 0
    rightControllerIndex = 1

    /**
     * @param {Element} root
     */
    constructor(root) {
        this.root = root
    }

    startGame() {
        this.clear()

        let game = new Game(this.randomSeedString)
        let gameRender = new GameRender(
            this.root,
            this.controllers[this.leftControllerIndex].create(game.leftRobot),
            this.controllers[this.rightControllerIndex].create(game.rightRobot),
        )

        gameRender.addMenuButton("BACK_TO_MENU", () => this.showMenu())
        gameRender.addMenuButton("RESTART_GAME", () => this.startGame())

        gameRender.render(game)

        const gameTickInterval = setInterval(() => {
            game.tick()
            gameRender.render(game)
        }, 1000);
        this.intervals.push(gameTickInterval)

        // TODO: think of a better solution, this should be handled by events or something...
        const helperInterval = setInterval(() => {
            gameRender.renderRobots(game)
        }, 100);
        this.intervals.push(helperInterval)
    }

    showMenu() {
        this.clear()

        const menu = document.createElement('div')
        menu.classList.add('menu')

        const heading = document.createElement("h1")
        heading.classList.add("line")
        heading.textContent = "PUNCH_CARDS"
        menu.append(heading)

        const randomSeedStringInput = document.createElement("input")
        randomSeedStringInput.classList.add("input")
        randomSeedStringInput.size = randomSeedStringInput.maxLength = 32
        randomSeedStringInput.value = this.randomSeedString
        randomSeedStringInput.addEventListener("input", () => {
            const randomSeedString = randomSeedStringInput.value.trim()
            this.randomSeedString = randomSeedString !== "" ? randomSeedString : null
        })
        const randomSeedStringLabel = document.createElement("label")
        randomSeedStringLabel.classList.add("line")
        randomSeedStringLabel.append("Random seed string: ")
        randomSeedStringLabel.append(randomSeedStringInput)
        menu.append(randomSeedStringLabel)

        const leftControllerHeading = document.createElement('div')
        leftControllerHeading.classList.add('line')
        leftControllerHeading.append("Choose left controller:")
        menu.append(leftControllerHeading)

        this.controllers.forEach((controller, index) => {
            const element = document.createElement('div')
            element.classList.add('line')
            element.classList.add("controller-left")
            element.append(controller.name)
            element.classList.toggle("selected", this.leftControllerIndex === index)
            element.addEventListener("click", () => {
                this.leftControllerIndex = index
                menu.querySelectorAll(".controller-left")
                    .forEach((e, i) => e.classList.toggle("selected", i === index))
            })
            menu.append(element)
        })

        const rightControllerHeading = document.createElement('div')
        rightControllerHeading.classList.add('line')
        rightControllerHeading.append("Choose right controller:")
        menu.append(rightControllerHeading)

        this.controllers.forEach((controller, index) => {
            const element = document.createElement('div')
            element.classList.add('line')
            element.classList.add("controller-right")
            element.append(controller.name)
            element.classList.toggle("selected", this.rightControllerIndex === index)
            element.addEventListener("click", () => {
                this.rightControllerIndex = index
                menu.querySelectorAll(".controller-right")
                    .forEach((e, i) => e.classList.toggle("selected", i === index))
            })
            menu.append(element)
        })

        const startGameButton = document.createElement('div')
        startGameButton.classList.add('button')
        startGameButton.classList.add('clickable')
        startGameButton.textContent = 'Fight!'
        startGameButton.addEventListener("click", () => this.startGame())
        menu.append(startGameButton)

        this.root.append(menu)
    }

    clear() {
        this.intervals.forEach(interval => clearInterval(interval))
        this.root.innerHTML = ''
    }
}
