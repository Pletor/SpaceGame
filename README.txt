General

- For running the project, you'll need node.js (https://nodejs.org/) and yarnpkg
  (https://yarnpkg.com/) installed on your working computer
- Unzip project
- Open command line and navigate to the unziped directory
- Run command "yarn install" from the command line to install required
  dependencies
- After dependencies are install, you can start the project by running command
  "yarn run server:start" which will run local web server and you can view the
  running game in the browser by visiting one http://localhost:8080/
- You can find documentation at https://docs.phaser.io/api-documentation and
  examples at https://phaser.io/examples/v3.85.0
- After you finish your work, zip the project again and send it back. Exclude
  directory "node_modules" from your zip archive, to prevent sending unnecessary
  files.

Project contains an empty game and it's up to you to implement the described
mini-game however you see fit and it can be as straight forward as you want.
There is also no extended functionality of Phaser engine and it's architecture,
so you can follow the documentation and examples.

Optional tasks are there only if you finish most of the regular tasks and would
still like to continue and give the game more polish. You can also try to do
some of these tasks instead of regular tasks, if you will find them easier to
do. Feel free to also come up with your own polishing task, but again, this is
purely optional.



For Windows users

Working on the project from Windows OS should also be possible, but we advise
you to either use Linux in dualboot, if you have it already installed, or run
Linux OS from a virtual machine, ie. VirtualBox (https://www.virtualbox.org/).
You can follow this article https://itsfoss.com/install-linux-in-virtualbox/ for
setting up your Linux machine. After that, you can follow install instructions
for both nodejs and yarkpkg.



Tasks:

=== Basic ======================================================================

Game level

    Implement loading of a level:
    - load main background of the level
    - spawn player's spaceship at initial position
    - initial position will be in the middle of the bottom edge of the screen


Player's input

    Implement controls for spaceship:
    - player should be able to move the ship with keyboard arrows in
      corresponding direction


Music

    Implement looping music that is played in background:
    - use asset 'background_loop' and start playing it at the start of the game


World bounds

    Implement invisible walls at the edges
    - make sure that the player cannot move out of the game area



=== Intermediate ===============================================================

Asteroids

    Implement spawning of asteroids
    - asteroids should spawn randomly above the top edge of the screen
    - they should start moving towards the bottom edge of the screen with
      a constant speed
    - they should despawn when they go past the bottom edge of the screen

    Implement collisions
    - asteroids should collide with player's spaceship
    - in the case of collision, respawn the player at the initial position



=== Advanced ===================================================================

Weapons

    Implement primary fire:
    - spaceship should shoot a weak single laser cannon from it's front center
    - fire should be repeated with a relatively small repeat rate, while fire
      button is pressed
    - primary fire button should be mapped to a spacebar

    Implement secondary fire:
    - spaceship should shoot a strong double laser cannon from it's wings
    - secondary fire button should be mapped to an alt
    - after secondary fire is used, start a 10s cooldown during which this
      fire cannot be used
    - visualize the cooldown with a progress bar

    Implement asteroid shatter:
    - add health to the individual asteroids
    - when asteroid is hit by a bullet, it decreases it's health
    - at zero health, asteroid should shatter into couple of smaller pieces,
      that should fly out in random direction and fade out after a short time
    - shards should not collide with the player



=== Optional ===================================================================

Lives

    Implement end game state:
    - player should have a limited number of revives
    - after he runs out of the revives a game over screen should be presented to
      the player with the ability to restart the game


Sound effects

    Implement various sounds:
    - shooting of the lasers
    - gaining and losing of shield
    - death sound
    - shatter of the asteroid


Effects

    Implement engine nozzles:
    - when spaceship is moving, visualize it by showing a fire effect going out
      of the engine nozzles at the back of the spaceship


Score

    Implement gaining of a score:
    - reward the player with points for shooting down the asteroids
    - score should be visible to the player somewhere on the screen


Shield

    Imeplement a power-up:
    - some asteroids can on their destruction drop a shield power up
    - when picked up by the player, it should apply a shield that prevents
      damage from asteroids
    - shield should stay up only for limited time
    - if another power up is picked with a shield already up, the timer for the
      shield should get reset and start again


Interface

    Implement selection of a ship:
    - let the player choose different spaceship
    - allow either selection of a color variation, or spaceship class, or both
