const randomSeedString = "punch-cards"

let game = new Game(randomSeedString)
let gameRender = new GameRender(
    document.getElementById('game'),
    new DirectRobotController(game.leftRobot),
    new RandobotController(game.rightRobot, randomSeedString),
)

gameRender.render(game)
setInterval(() => {
    game.tick()
    gameRender.render(game)
}, 1000)

// TODO: think of a better solution, this should be handled by events or something...
setInterval(() => {
    gameRender.renderRobots(game)
}, 100)
