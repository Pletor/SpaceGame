import '../../assets/html/style.css'
import * as Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { PreloadScene } from '../scenes/PreloadScene'
import { GameScene } from '../scenes/GameScene'

const config : Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT
    },
    width: 1920,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            debugShowBody: false,
            debugShowStaticBody: false,
            debugShowVelocity: false
        }
    },
    pixelArt: true,
    roundPixels: true,
    scene: [BootScene, PreloadScene, GameScene],
    render: {
        antialias: false,
        pixelArt: true,
        transparent: false
    }
}

export default new Phaser.Game(config)
