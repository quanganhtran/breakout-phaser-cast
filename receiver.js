let strafeLeft, strafeRight;

let connectionIdx = 0;

const Breakout = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Breakout() {
            Phaser.Scene.call(this, {key: 'breakout'});

            this.bricks;
            this.paddle;
            this.ball;
        },

    preload: function () {
        this.load.atlas('assets', 'assets/breakout.png', 'assets/breakout.json');
    },

    create: function () {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: ['blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1'],
            frameQuantity: 10,
            gridAlign: {width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100}
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        //  Input events
        strafeLeft = strafe(this, true);
        strafeRight = strafe(this, false);

        this.input.on('pointermove', function (pointer) {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }

        }, this);

        this.input.on('pointerup', function (pointer) {

            launch(this);

        }, this);

        if (navigator.presentation.receiver) {
            navigator.presentation.receiver.connectionList
                .then(list => {
                    list.connections.map(connection => addConnection(this, connection));
                    list.addEventListener('connectionavailable', function(event) {
                        addConnection(event.connection);
                    });
                });
        }
    },

    hitBrick: function (ball, brick) {
        brick.disableBody(true, true);

        if (this.bricks.countActive() === 0) {
            this.resetLevel();
        }
    },

    resetBall: function () {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    },

    resetLevel: function () {
        this.resetBall();

        this.bricks.children.each(function (brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    hitPaddle: function (ball, paddle) {
        let diff = 0;

        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    },

});

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-receiver',
    scene: [ Breakout ],
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);

function strafe(scene, left) {
    const multiplier = left ? -1 : 1;
    const speed = 4;
    return function () {

        //  Keep the paddle within the game
        scene.paddle.x = Phaser.Math.Clamp(scene.paddle.x + speed * multiplier, 52, 748);

        if (scene.ball.getData('onPaddle')) {
            scene.ball.x = scene.paddle.x;
        }

    }
}

function launch(scene) {
    if (scene.ball.getData('onPaddle')) {
        scene.ball.setVelocity(-75, -300);
        scene.ball.setData('onPaddle', false);
    }
}

function addConnection(scene, connection) {
    connection.connectionId = ++connectionIdx;

    connection.addEventListener('message', function(event) {

        switch (event.data) {
            case 'left':
                strafeLeft();
                break;
            case 'right':
                strafeRight();
                break;
            case 'ball':
                launch(scene);
                break;
        }
    });

    window.addEventListener('error', function(event) {
        connection.send(JSON.stringify(event));
    });

}