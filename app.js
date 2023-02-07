let game = new Game()
let gameRender = new GameRender(
    document.getElementById('game'),
    new DirectRobotController(game.leftRobot),
    new DirectRobotController(game.rightRobot),
)

gameRender.render(game)
setInterval(() => {
    game.tick()
    gameRender.render(game)
}, 1000)

// TODO: think of a better solution, this should be handled by events or someting...
setInterval(() => {
    gameRender.renderRobots(game)
}, 100)
