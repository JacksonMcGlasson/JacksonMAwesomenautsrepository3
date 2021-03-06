game.PlayerEntity = me.Entity.extend({
    init: function (x, y, settings) {
        this.setSuper(x, y);
        this.setPlayerTimers();
        this.setAttributes();
        this.type = "PlayerEntity";
        this.setFlags();
        //makes screen follow player
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

        this.addAnimation();
        //sets current animation for game start
        this.renderable.setCurrentAnimation("idle");
    },
    setSuper: function (x, y) {
        this._super(me.Entity, 'init', [x, y, {
                image: "player",
                width: 64,
                height: 64,
                spritewidth: "64",
                spriteheight: "64",
                getShape: function () {
                    return(new me.Rect(0, 0, 64, 64)).toPolygon();
                }
            }]);
    },
    setPlayerTimers: function () {
        this.now = new Date().getTime();
        this.lastHit = this.now;
        this.lastSpear = this.now;
        this.lastBurst = this.now;
        this.lastAttack = new Date().getTime();
    },
    setAttributes: function () {
        this.body.setVelocity(game.data.playerMoveSpeed += game.data.exp2, 20);
        this.health = game.data.playerHealth += game.data.exp4;
        this.attack = game.data.playerAttack += game.data.exp3;
    },
    setFlags: function () {
        this.facing = "right";
        this.dead = false;
        this.attacking = false;
    },
    addAnimation: function () {
        //adds animations for name, frames and speed
        this.renderable.addAnimation("idle", [78]);
        this.renderable.addAnimation("walk", [117, 118, 119, 120, 121, 122, 123, 124, 125], 80);
        this.renderable.addAnimation("attack", [65, 66, 67, 68, 69, 70, 71, 72], 80);
    },
    update: function (delta) {
        this.now = new Date().getTime();
        this.dead = this.checkIfDead();
        this.checkKeyPressesAndMove();
        this.checkAbilityKeys();
        this.setAnimation();
        me.collision.check(this, true, this.collideHandler.bind(this), true);
        this.body.update(delta);
        this._super(me.Entity, "update", [delta]);
        return true;
    },
    checkIfDead: function () {
        //if health is below zero
        if (this.health <= 0) {
            //you are dead
            return true;
        }
        return false;
    },
    checkKeyPressesAndMove: function () {
        //control for moving right
        if (me.input.isKeyPressed("right")) {
            this.moveRight();
        }
        //control for moving left
        else if (me.input.isKeyPressed("left")) {
            this.moveLeft();
        }
        //for when mario stands still
        else {
            this.body.vel.x = 0;
        }
        //control for jumping
        if (me.input.isKeyPressed('jump')) {
            this.jump();

        }

        this.attacking = me.input.isKeyPressed('attack');
    },
    moveRight: function () {
        this.body.vel.x += this.body.accel.x * me.timer.tick;
        this.facing = "right";
        this.flipX(true);
    },
    moveLeft: function () {
        this.body.vel.x -= this.body.accel.x * me.timer.tick;
        this.facing = "left";
        this.flipX(false);
    },
    jump: function () {
        // make sure we are not already jumping or falling
        if (!this.body.jumping && !this.body.falling) {
            // set current vel to the maximum defined value
            this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
            this.body.jumping = true;
        }
    },
    checkAbilityKeys: function () {
        //ability for a temporary speed burst
        if (me.input.isKeyPressed("ability1")) {
            this.speedBurst();
            //ability to absorb player creep health
        } else if (me.input.isKeyPressed("ability2")) {
            //this.eatCreep();
            //ability to throw spear
        } else if (me.input.isKeyPressed("ability3")) {
            this.throwSpear();
        }
    },
    //creates spear
    throwSpear: function () {
        if ((this.now - this.lastSpear) >= game.data.spearTimer * 1000 && game.data.ability3 >= 0) {
            this.lastSpear = this.now;
            var spear = me.pool.pull("spear", this.pos.x, this.pos.y, {}, this.facing);
            me.game.world.addChild(spear, 10);
        }
    },
    //creates speed boost
    speedBurst: function () {
        if ((this.now - this.lastBurst) >= game.data.burstTimer * 1000 && game.data.ability1 >= 0) {
            this.lastBurst = this.now;
            this.body.vel.x += game.data.ability1 * 3;
        }
    },
    setAnimation: function () {
        //if the player is attacking set these animations
        if (this.attacking) {
            if (!this.renderable.isCurrentAnimation("attack")) {
                //sets animation to attack than to idle
                this.renderable.setCurrentAnimation("attack", "idle");
                //begin from first animation
                this.renderable.setAnimationFrame();
            }


        } else if (this.body.vel.x !== 0 && !this.renderable.isCurrentAnimation("attack")) {
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
                this.renderable.setAnimationFrame();
            }
        } else if (!this.renderable.isCurrentAnimation("attack")) {
            this.renderable.setCurrentAnimation("idle");
        }
    },
    //how the player loses health
    loseHealth: function (damage) {
        this.health = this.health - damage;
        //  console.log(this.health);
    },
    //what happems when the player collides with things
    collideHandler: function (response) {
        //console.log(this.health);
        //collisions with the enemy base
        if (response.b.type === 'EnemyBaseEntity') {
            this.collideWithEnemyBase(response);
            //player collisions with enemycreeps
        } else if (response.b.type === "EnemyCreep") {
            this.collideWithEnemyCreep(response);
            //player collision with player creep
        } else if (response.b.type === "PlayerCreep") {
            this.collideWithPlayerCreep(response);
            //player collision with enmey hero
        } else if (response.b.type === "EnemyHero") {
            this.collideWithEnemyHero(response);

        }
    },
    collideWithEnemyBase: function (response) {
        var ydif = this.pos.y - response.b.pos.y;
        var xdif = this.pos.x - response.b.pos.x;
        //collision from the top
        if (ydif < -40 && xdif > 70 && xdif < -35) {
            this.body.falling = false;
            this.body.vel.y = -1;
        }
        //collision from the left
        else if (xdif > -35 && this.facing === "right" && (xdif < 0) && ydif > -50) {
            //stops player
            this.body.vel.x = 0;
            //collision from the right
        } else if (xdif < 70 && this.facing === "left" && (xdif > 0) && ydif > -50) {
            //stops player
            this.body.vel.x = 0;
        }
        //collision from the top
        else if (ydif < -40) {
            this.body.falling = false;
            this.body.vel.y = -1;
        }
        //attacking the base
        if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer) {
            this.lastHit = this.now;
            response.b.loseHealth(game.data.playerAttack);
        }
    },
    collideWithEnemyCreep: function (response) {
        var xdif = this.pos.x - response.b.pos.x;
        var ydif = this.pos.y - response.b.pos.y;
        this.stopMovement(xdif);
        if (this.checkAttack(xdif, ydif)) {
            this.hitCreep(response);
        }
    },
    collideWithPlayerCreep: function (response) {

    },
    collideWithEnemyHero: function (response) {
        var xdif = this.pos.x - response.b.pos.x;
        var ydif = this.pos.y - response.b.pos.y;
        this.stopMovement(xdif);
        if (this.checkAttack(xdif, ydif)) {
            this.hitEnemyHero(response);
        }
    },
    stopMovement: function (xdif) {
        if (xdif > 0) {
            this.pos.x = this.pos.x + 1;
            if (this.facing === "left") {
                this.body.vel.x = 0;
            }
        } else {
            this.pos.x = this.pos.x - 1;
            if (this.facing === "right") {
                this.body.vel.x = 0;
            }
        }
    },
    checkAttack: function (xdif, ydif) {
        if (this.renderable.isCurrentAnimation("attack") && this.now - this.lastHit >= game.data.playerAttackTimer
                && (Math.abs(ydif) <= 40) &&
                (((xdif > 0) && this.facing === "left") || ((xdif < 0) && this.facing === "right"))
                ) {
            this.lastHit = this.now;
            //if creep health is less than attack
            return true;
        }
        return false;
    },
    hitCreep: function (response) {
        if (response.b.health <= game.data.playerAttack) {
            //adds gold for a creep kill
            game.data.gold += 1;
            console.log("current gold: " + game.data.gold);
        }
        response.b.loseHealth(game.data.playerAttack);
    },
    hitEnemyHero: function (response) {
        if (response.b.health <= game.data.playerAttack) {
            //adds gold for a creep kill
            game.data.gold += 10;
            console.log("current gold: " + game.data.gold);
        }
        response.b.loseHealth(game.data.playerAttack);
    }
});