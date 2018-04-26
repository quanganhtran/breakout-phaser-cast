let keyA, keyD, spacebar;

const presentationRequest = new PresentationRequest(['receiver.html']);

let presentationConnection;

presentationRequest.addEventListener('connectionavailable', function(event) {
    presentationConnection = event.connection;
    presentationConnection.addEventListener('close', function() {
        console.log('> Connection closed.');
    });
    presentationConnection.addEventListener('terminate', function() {
        console.log('> Connection terminated.');
    });
    presentationConnection.addEventListener('message', function(event) {
        console.log('>', JSON.parse(event.data));
    });
});

window.addEventListener('beforeunload', () => {
    presentationConnection && presentationConnection.terminate();
});

// Make this presentation the default one when using the "Cast" browser menu.
navigator.presentation.defaultRequest = presentationRequest;

const Breakout = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Breakout() {
            Phaser.Scene.call(this, {key: 'breakout'});
        },

    create: function () {

        //  Input events
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        document.getElementById('start').addEventListener('click', start);
    },

    update: function () {

        if (Phaser.Input.Keyboard.JustDown(spacebar))
        {
            presentationConnection.send('ball');
        }

        if (keyA.isDown) {
            presentationConnection.send('left');
        } else if (keyD.isDown) {
            presentationConnection.send('right');
        }
    }

});

const config = {
    type: Phaser.WEBGL,
    width: 0,
    height: 0,
    parent: 'phaser-sender',
    scene: [ Breakout ],
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);

function start() {
    presentationRequest.start()
        .then(connection => {
            console.log('> Connected to ' + connection.url + ', id: ' + connection.id);
        })
        .catch(error => {
            console.log('> ' + error.name + ': ' + error.message);
        });
}