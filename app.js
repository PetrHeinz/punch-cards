let game = new Game()
let gameRender = new GameRender(document.getElementById('game'))

gameRender.render(game)
setInterval(() => {
    game.tick()
    gameRender.render(game)
}, 1000)
