import StatsPlayer from "./StatsPlayer.js";
import DamagePlayer from "./DamagePlayer.js";
import { PLAYER_CLASSES } from "./PlayerClass.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, classKey) {

    const classConfig = PLAYER_CLASSES[classKey];

    if (!classConfig) {
      return;
    }

    const textureKey = scene.textures.exists(classConfig.texture)
      ? classConfig.texture
      : "player";

    super(scene, x, y, textureKey, classConfig.frame ?? 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.8);
    this.setOrigin(0.5, 0.8);

    if (classKey === "alquimista") {
      this.setSize(58, 110);
      this.setOffset(34, 118);
      this.setScale(0.55);
    } else if (classKey === "coveiro") {
      this.setSize(70, 96);
      this.setOffset(109, 250);
      this.setScale(0.34);
    } else {
      this.setSize(80, 120);
      this.setOffset(88, 100);
      this.setScale(0.5, 0.75);
    }

    this.animState = "idle";
    this.lastAnim = "";

    this.classKey = classKey;
    this.classConfig = classConfig;

    this.stats = new StatsPlayer(this, classConfig.stats);
    this.damageSystem = new DamagePlayer(this, this.stats);

    this.speedBase = 200;
    this.speedModifiers = {};
    this.speed = this.speedBase;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;

    this.maxHP = this.getStat("maxHP", 100);
    this.currentHP = this.maxHP;

    this.baseDamage = 5;

    this.syncStats();

    this.keys = scene.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
      dash: "SPACE",
    });

    this.dashing = false;
    this.dashCooldown = false;

    this.setCollideWorldBounds(true);
    this.facing = "down";

    this.canAttack = true;
    this.inputLocked = false;

    this.createAnimations();
  }

  getStat(key, fallback = 0) {
    if (typeof this.stats?.get === "function") {
      return this.stats.get(key, fallback);
    }

    return this.stats?.[key] ?? fallback;
  }

  syncStats() {
    this.maxHP = this.getStat("maxHP", this.maxHP || 100);
    this.currentHP = Phaser.Math.Clamp(this.currentHP ?? this.maxHP, 0, this.maxHP);

    this.speed = this.stats?.movementSpeed ?? this.speedBase;
    this.magnetRadius = this.getStat("pickupRadius", 1) * 100;
    this.xpGain = this.getStat("xpGain", 1);

    this.attackSpeed = this.getStat("attackSpeed", 1);
    this.globalCD = this.getStat("globalCD", 1);
    this.projectileSpeed = this.getStat("projectileSpeed", 1);
    this.pierce = this.getStat("pierce", 0);
    this.aoe = this.getStat("aoe", 1);
    this.knockbackBonus = this.getStat("knockback", 1);
    this.dotDamageBonus = 1 + this.getStat("dotDamageBonus", 0);
    this.debuffDurationMultiplier = this.getStat("debuffDurationMultiplier", 1);
    this.slowRadiusBonus = this.getStat("slowRadiusBonus", 0);
    this.auraRange = this.getStat("auraRange", 110);
  }

  update() {

    if (this.inputLocked) {
      this.setVelocity(0, 0);
      return;
    }

    this.handleMovement();
    this.handleDash();
  }

  handleMovement() {

    const { up, down, left, right } = this.keys;

    let vx = 0;
    let vy = 0;

    // ── JOYSTICK (mobile) ──────────────────────
    const joy = this.scene.joystick;
    if (joy && joy.active) {
      vx = joy.vx;
      vy = joy.vy;
    } else {
      // ── TECLADO (desktop / fallback) ──────────
      if (up.isDown) vy = -1;
      else if (down.isDown) vy = 1;

      if (left.isDown) vx = -1;
      else if (right.isDown) vx = 1;
    }

    const speed = this.dashing ? this.speed * 3 : this.speed;

    const vec = new Phaser.Math.Vector2(vx, vy).normalize();

    this.setVelocity(vec.x * speed, vec.y * speed);

    if (vx !== 0 || vy !== 0) {
      this.facing = this.getFacingDirection(vx, vy);
    }

    this.updateAnimations(vx, vy);
  }

  getFacingDirection(vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) {
      return vx > 0 ? "right" : "left";
    }

    return vy > 0 ? "down" : "up";
  }

  handleDash() {

    if (!this.canAttack) return;

    // ── JOYSTICK dash (mobile) ──────────────────
    const joy = this.scene.joystick;
    const joystickDash = joy && joy.dashPressed;

    // ── TECLADO dash (desktop / fallback) ───────
    const keyboardDash = this.keys.dash.isDown;

    if ((keyboardDash || joystickDash) && !this.dashing && !this.dashCooldown) {

      // consome o sinal do botão para não repetir
      if (joystickDash) joy.consumeDash();

      this.dashing = true;
      this.dashCooldown = true;

      this.scene.time.delayedCall(150, () => {
        this.dashing = false;
      });

      this.scene.time.delayedCall(600, () => {
        this.dashCooldown = false;
      });
    }
  }

  gainXP(amount) {

    const multiplier = this.xpGain ?? 1;
    const final = Math.floor(amount * multiplier);

    this.xp += final;

    this.scene?.updateXpBar?.();

    while (this.xp >= this.xpToNext) {
      this.levelUp();
    }

    return final;
  }

  levelUp() {

    this.level++;

    this.xp -= this.xpToNext;

    this.xpToNext = Math.floor(this.xpToNext * 1.25);

    this.stats.addFlat("maxHP", 10);

    this.baseDamage += 1;

    this.syncStats();

    this.currentHP = this.maxHP;

    this.scene?.updateHealthBar?.();
    this.scene?.updateXpBar?.();

    if (this.scene?.upgradeSystem?.openUpgradeMenu) {
      this.scene.upgradeSystem.openUpgradeMenu();
    }
  }

  takeDamage(amount) {
    this.damageSystem.takeDamage(amount);
  }

  heal(amount) {
    this.damageSystem.heal(amount);
  }

  refillShield(amount) {
    this.damageSystem.addShield(amount);
  }

  createAnimations() {

    const anims = this.scene.anims;
    const animConfig = this.classConfig.animations;

    for (const key in animConfig) {

      const animKey = `${this.classKey}-${key}`;

      if (anims.exists(animKey)) continue;

      anims.create({
        key: animKey,

        frames: anims.generateFrameNumbers(this.texture.key, {
          start: animConfig[key].start,
          end: animConfig[key].end
        }),

        frameRate: animConfig[key].frameRate || 8,
        repeat: animConfig[key].repeat ?? -1
      });
    }
  }

  updateAnimations(vx, vy) {

    // NÃO deixa walk/idle interromper arremesso
    if (
      this.animState === "throw" ||
      this.animState === "throwFollow"
    ) {
      return;
    }

    let state = "idle";

    if (vx !== 0 || vy !== 0) {
      state = "walk";
    }

    if (
      (this.classKey === "coveiro" ||
        this.classKey === "alquimista")
      && vx !== 0
    ) {
      this.setFlipX(vx < 0);
    }

    if (this.animState !== state) {
      this.animState = state;
    }

    const animKey = `${this.classKey}-${this.animState}`;

    if (!this.scene.anims.exists(animKey)) {
      console.warn("Animacao inexistente:", animKey);
      return;
    }

    if (this.lastAnim !== animKey) {
      this.play(animKey, true);
      this.lastAnim = animKey;
    }


    if (vx === 0 && vy === 0 && state === "idle") {

      this.stop();

      const idleConfig = this.classConfig.animations.idle;

      this.setFrame(idleConfig.start);
    }
  }

  playThrowAnimation() {

    if (this.classKey !== "alquimista") return;

    const throwKey = "alquimista-throw";
    const followKey = "alquimista-throwFollow";

    if (
      !this.scene.anims.exists(throwKey) ||
      !this.scene.anims.exists(followKey)
    ) {
      console.warn("Animacoes nao encontradas");
      return;
    }

    this.animState = "throw";
    this.play(throwKey, true);

    const onThrowComplete = (animation) => {
      if (animation.key !== throwKey) return;
      this.off(Phaser.Animations.Events.ANIMATION_COMPLETE, onThrowComplete);

      if (this.animState !== "throw") return;

      this.animState = "throwFollow";
      this.play(followKey, true);

      const onFollowComplete = (animation2) => {
        if (animation2.key !== followKey) return;
        this.off(Phaser.Animations.Events.ANIMATION_COMPLETE, onFollowComplete);

        if (this.animState !== "throwFollow") return;

        const vel = this.body?.velocity;
        const moving = vel && (Math.abs(vel.x) > 5 || Math.abs(vel.y) > 5);
        this.animState = moving ? "walk" : "idle";
        this.lastAnim = "";
      };

      this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, onFollowComplete);
    };

    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, onThrowComplete);
  }

  lockInput() {
    this.inputLocked = true;
  }

  unlockInput() {
    this.inputLocked = false;
  }

  die() {
    this.setTint(0xf00);
    this.setVelocity(0, 0);
    this.scene.playerDied();
  }
}