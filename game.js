let game;
 
// global game options
let gameOptions = {
    platformStartSpeed: 350,
    platformSpeedRange: [300, 400],
    spawnRange: [80, 300],
    platformSizeRange: [80, 300],
    platformHeightRange: [-5, 5],
    platformHeighScale: 20,
    platformVerticalLimit: [0.4, 0.8],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 4,
    auraPercent: 75
}
 
window.onload = function() {
 
    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1334,
        height: 750,
        scene: [preloadGame, playGame],

        audio: {
            disableWebAudio: true
        },
 
        // physics settings
        physics: {
            default: "arcade"
        },

        
    }
    
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}
 
// preLoad Game scene
class preloadGame extends Phaser.Scene{
    constructor(){
        super("PreloadGame");
    }
    preload(){
        //this.load.image("platform", "images/platform1.png");
        this.load.image("platform", "images/platform.png");
        this.load.image("player", "images/player.png");
        this.load.spritesheet("aura", "images/coin.png", {
            frameWidth: 20,
            frameHeight: 20
        });

        this.load.audio('theme', ['audio.ogg','audio.mp3']);
        this.load.audio('beep', ['mario_coin.ogg','mario_coin.mp3']);
        this.load.audio('bounce', ['bounce.mp3']);
    }
    create(){
        

        this.anims.create({
            key: "rotate",
            frames: this.anims.generateFrameNumbers("aura", {
                start: 0,
                end: 5
            }),
            frameRate: 20,
            yoyo: true,
            repeat: -1
        });
 
        this.scene.start("PlayGame");
        }

        
}

class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
        
    }
    preload(){
        this.load.image("background", "images/background.jpg");

    }
    create(){
        var point = this.sound.add('beep');
        var music = this.sound.add('theme',{volume: 0.2});
        
        music.loop = true;
        music.play();
        
        this.background = this.add.image(0, 0, "background").setOrigin(0, 0);

        // Based on your game size, it may "stretch" and distort.
        this.background.displayWidth = this.sys.canvas.width;
        this.background.displayHeight = this.sys.canvas.height;

        // keeping track of added platforms
        this.addedPlatforms = 0;

        // group with all active platforms.
        this.platformGroup = this.add.group({
            // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });
 
        // pool
        this.platformPool = this.add.group({
            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });

        // group with all active aura.
        this.auraGroup = this.add.group({
 
            // once a aura is removed, it's added to the pool
            removeCallback: function(aura){
                aura.scene.auraPool.add(aura)
            }
        });
 
        // aura pool
        this.auraPool = this.add.group({
 
            // once a aura is removed from the pool, it's added to the active auras group
            removeCallback: function(aura){
                aura.scene.auraGroup.add(aura)
            }
        });
 
        // number of consecutive jumps made by the player
        this.playerJumps = 0;
 
        // adding a platform to the game, the arguments are platform width and x , y position
        this.addPlatform(game.config.width, game.config.width / 2, game.config.height * gameOptions.platformVerticalLimit[1]); 
        
        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height * 0.5, 'player');
        this.player.displayHeight=80;
        this.player.displayWidth=80;
        this.player.setGravityY(gameOptions.playerGravity);
 
        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup);

        //score text
        var scoreText;

        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '100px', fill: '#fff' });

        // setting collisions between the player and the aura group
        var score = 0;

        this.physics.add.overlap(this.player, this.auraGroup, function(player, aura){
            aura.disableBody(true, true);
            point.play();
            score += 1;
            scoreText.setText('Score: ' + score);
            this.tweens.add({
                targets: aura,
                y: aura.y - 70,
                alpha: 0,
                duration: 800,
                ease: "Cubic.easeOut",
                callbackScope: this,
                onComplete: function(){
                    this.auraGroup.killAndHide(aura);
                    this.auraGroup.remove(aura);
                }
            });
        }, null, this);

        // checking for input
        this.input.on("pointerdown", this.jump, this);
        
    
    }
 
    // the core of the script: platform are added from the pool or created on the fly
    addPlatform(platformWidth, posX, posY){
        this.addedPlatforms ++;
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        }
        else{
            platform = this.physics.add.sprite(posX, posY, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]); 

        // is there an aura over the platform?
        if(this.addedPlatforms > 1){
            if(Phaser.Math.Between(1, 100) <= gameOptions.auraPercent){
                if(this.auraPool.getLength()){
                    let aura = this.auraPool.getFirst();
                    aura.x = posX;
                    aura.y = posY - 80;
                    aura.alpha = 1;
                    aura.active = true;
                    aura.visible = true;
                    this.auraPool.remove(aura);
                }
                else{
                    let aura = this.physics.add.sprite(posX, posY - 80, "aura");
                    aura.setImmovable(true);
                    aura.setVelocityX(platform.body.velocity.x);
                    aura.anims.play("rotate");
                    this.auraGroup.add(aura);
                }
            }
        }
    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump(){
        var bounce = this.sound.add('bounce',{ loop: false });
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
            bounce.play();
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
        }
    }
    update(){
        // game over
        if(this.player.y > game.config.height){
            this.scene.start("PlayGame")
        }
        this.player.x = gameOptions.playerStartPosition;
 
        // recycling platforms
        let minDistance = game.config.width;
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            if(platformDistance < minDistance){
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // recycling aura
        this.auraGroup.getChildren().forEach(function(aura){
            if(aura.x < - aura.displayWidth / 2){
                this.auraGroup.killAndHide(aura);
                this.auraGroup.remove(aura);
            }
        }, this);

        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            let platformRandomHeight = gameOptions.platformHeighScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1]);
            let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight;
            let minPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[0];
            let maxPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[1];
            let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2, nextPlatformHeight);
        }
    }

};

function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
