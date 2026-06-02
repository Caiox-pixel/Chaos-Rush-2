import EnemyBullet from "../Enemy/EnemyBullet.js";

const resolveAIType = (type) => {
  if (!type) return "chaser";
  if (type.startsWith("shooter")) return "shooter";
  if (type.startsWith("wanderer")) return "wanderer";
  if (type.startsWith("tank")) return "chaser";
  if (type.startsWith("fast")) return "chaser";
  return "chaser";
};

const resolveVariant = (type) => {
  if (!type) return "chaser";
  if (type.startsWith("shooter")) return "shooter";
  if (type.startsWith("wanderer")) return "wanderer";
  if (type.startsWith("tank")) return "tank";
  if (type.startsWith("fast")) return "fast";
  if (type.startsWith("elite")) return "elite";
  return "chaser";
};

const resolveSpriteVariant = (variant, aiType) => {
  if (variant === "tank" || variant === "fast" || variant === "elite") return "chaser";
  return aiType;
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = "chaser") {
    const aiType = resolveAIType(type);
    const variant = resolveVariant(type);
    const spriteVariant = resolveSpriteVariant(variant, aiType);
    const textureKey = `enemy_${spriteVariant}_front`;
    super(scene, x, y, scene.textures.exists(textureKey) ? textureKey : "enemy");

    this.scene = scene;
    this.variant = variant;
    this.aiType = aiType;
    this.spriteVariant = spriteVariant;
    this.spritePose = "front";

    // alvo padrão
    this.target = scene.player ?? null;

    // -------------------------
    // ESCALONAMENTO
    const playerLevel = scene.player?.level ?? 1;
    const gameLevel = scene.level ?? scene.wave ?? 1;

    const hpScale = 1 + gameLevel * 0.25;
    const damageScale = 1 + gameLevel * 0.28;

    const speedScale = 1 + Math.min(gameLevel * 0.03, 0.25);

    // -------------------------
    // STATS BASE
    const baseStats = {
      chaser: { hp: 20, speed: 80, damage: 10, tint: 0xff3333, xp: 10 },
      wanderer: { hp: 100, speed: 60, damage: 8, tint: 0x33ff33, xp: 12 },
      shooter: { hp: 80, speed: 40, damage: 10, tint: 0xff9900, xp: 15 },
    };

    const stats = baseStats[this.aiType] ?? baseStats.chaser;

    // -------------------------
    // ATRIBUTOS
    this.speed = Math.round(stats.speed * speedScale);
    this.maxHP = Math.round(stats.hp * hpScale);
    this.currentHP = this.maxHP;
    this.damage = Math.round(stats.damage * damageScale);

    this.xpValue = Math.round(stats.xp * hpScale);


    this.isDead = false;

    // -------------------------
    // PHASER SETUP
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCollideWorldBounds(false);
    this.body.setAllowGravity(false);
    this.configureSpriteBody();
    this.applyTint();

    // -------------------------
    // COMPORTAMENTO
    this.wanderTimer = 0;

    if (this.aiType === "wanderer") {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.setVelocity(
        Math.cos(angle) * this.speed * 0.6,
        Math.sin(angle) * this.speed * 0.6
      );

      this.wanderTimer = Phaser.Math.Between(400, 1200);
    }


    this.shootCooldown = 1800;
    this.lastShotTime = 0;

    this.strafeTimer = 0;
    this.strafeDir = 1;

    console.log("Enemy spawn:", {
      rawType: type,
      variant: this.variant,
      aiType: this.aiType
    });

  }

  // =====================================================
  update(time, delta) {
    if (!this.active || this.isDead) {
      this.setVelocity(0, 0);
      return;
    }

    if (!this.target && this.scene.player) {
      this.target = this.scene.player;
    }

    if (!this.target || !this.target.active) {
      this.setVelocity(0, 0);
      return;
    }

    switch (this.aiType) {
      case "wanderer":
        this.updateWanderer(delta);
        break;
      case "shooter":
        this.updateShooter(time, this.target, delta);
        break;
      case "chaser":
      default:
        this.updateChaser(this.target);
        break;
    }

    this.updateSpritePose();
  }

  setTarget(target) {
    this.target = target;
  }

  // =====================================================
  updateChaser(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > 1) {
      const dist = Math.sqrt(distSq);
      this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
    } else {
      this.setVelocity(0, 0);
    }
  }

  updateWanderer(delta) {
    this.wanderTimer -= delta;

    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 120 * 120) {
        const dist = Math.sqrt(distSq);
        this.setVelocity(
          (dx / dist) * this.speed * 0.4,
          (dy / dist) * this.speed * 0.4
        );
        return;
      }
    }

    if (this.wanderTimer <= 0) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
      this.wanderTimer = Phaser.Math.Between(600, 1500);
    }
  }


  updateShooter(time, target, delta) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const idealMin = 120;
    const idealMax = 250;

    if (dist > idealMax) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    }
    else if (dist < idealMin) {
      this.setVelocity(-Math.cos(angle) * this.speed, -Math.sin(angle) * this.speed);
    }
    else {
      this.setVelocity(0, 0);

      this.strafeTimer -= delta;
      if (this.strafeTimer <= 0) {
        this.strafeDir = Phaser.Math.Between(0, 1) ? 1 : -1;
        this.strafeTimer = Phaser.Math.Between(400, 1000);
      }

      const perp = angle + Math.PI / 2 * this.strafeDir;
      this.setVelocity(
        Math.cos(perp) * this.speed * 0.6,
        Math.sin(perp) * this.speed * 0.6
      );

      const now = time;
      if (now - this.lastShotTime >= this.shootCooldown) {
        this.lastShotTime = now;
        this.preShootWarning(target);
      }
    }
  }


  // =====================================================
  configureSpriteBody() {
    this.clearTint();
    this.setOrigin(0.5, 0.65);

    const displaySizes = {
      chaser: { w: 54, h: 72 },
      wanderer: { w: 58, h: 46 },
      shooter: { w: 48, h: 70 }
    };

    const bodySizes = {
      chaser: { w: 44, h: 48 },
      wanderer: { w: 52, h: 34 },
      shooter: { w: 38, h: 56 }
    };

    const display = displaySizes[this.spriteVariant] ?? displaySizes.chaser;
    const body = bodySizes[this.spriteVariant] ?? bodySizes.chaser;

    this.setDisplaySize(display.w, display.h);

    const frameWidth = this.frame?.realWidth || this.width || display.w;
    const frameHeight = this.frame?.realHeight || this.height || display.h;
    const scaleX = display.w / frameWidth;
    const scaleY = display.h / frameHeight;

    this.body.setSize(body.w / scaleX, body.h / scaleY, true);
  }

  updateSpritePose() {
    const lookTarget = this.target?.active ? this.target : this.scene.player;
    if (!lookTarget?.active) return;

    const dx = lookTarget.x - this.x;
    const dy = lookTarget.y - this.y;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

    let pose = "front";
    let flipX = false;

    if (Math.abs(dx) > Math.abs(dy) * 0.65) {
      pose = "side";
      flipX = dx < 0;
    } else if (dy < 0) {
      pose = "back";
    }

    const key = `enemy_${this.spriteVariant}_${pose}`;
    if (this.scene.textures.exists(key) && (this.spritePose !== pose || this.texture.key !== key)) {
      this.spritePose = pose;
      this.setTexture(key);
      this.configureSpriteBody();
    }

    this.setFlipX(flipX);
  }

  // =====================================================
  preShootWarning(target) {
    // aviso visual de disparo
    this.setTint(0xff3333);

    this.scene.time.delayedCall(120, () => {
      if (!this.active || this.isDead) return;

      // restaura a cor correta da variante
      this.applyTint();

      const errX = Phaser.Math.Between(-40, 40);
      const errY = Phaser.Math.Between(-40, 40);

      this.shootAt(target, errX, errY);
    });
  }


  shootAt(target, errX = 0, errY = 0) {
    if (!target?.active) return;
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      target.x + errX,
      target.y + errY
    );

    const proj = new EnemyBullet(
      this.scene,
      this.x,
      this.y,
      angle,
      this.damage
    );

    this.scene.enemyBullets.add(proj);

    const baseAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      target.x,
      target.y
    );

    const spread = Phaser.Math.DegToRad(
      Phaser.Math.Between(-6, 6)
    );

    const finalAngle = baseAngle + spread;

    if (!proj) return;

    proj.setActive(true);
    proj.setVisible(true);
    proj.body.setAllowGravity(false);

    const cleanup = () => {
      if (!proj.active) return;
      proj.destroy();
      if (hit) hit.destroy();
    };

    const hit = this.scene.physics.add.overlap(proj, target, cleanup);

    this.scene.time.delayedCall(2200, cleanup);
  }

  // =====================================================

  applyTint() {
    const fallbackTints = {
      chaser: 0xff3333,
      wanderer: 0x33ff33,
      shooter: 0xff9900,
    };

    if (this.texture?.key?.startsWith("enemy_")) {
      this.clearTint();
      return;
    }

    this.setTint(fallbackTints[this.aiType] ?? 0xffffff);
  }

  takeDamage(amount, options = {}) {
    if (this.isDead) return;

    const { isCrit = false } = options;

    this.currentHP -= amount;
    this.flashDamage();

    // 💥 TEXTO DE DANO
    if (this.scene.createFloatingText) {
      const color = isCrit ? "#ffd700" : "#ffffff";
      const size = isCrit ? "26px" : "18px";

      const txt = this.scene.add.text(this.x, this.y - 20, Math.floor(amount), {
        fontSize: size,
        color: color,
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 5
      }).setOrigin(0.5);

      this.scene.tweens.add({
        targets: txt,
        y: this.y - 60,
        alpha: 0,
        scale: isCrit ? 1.4 : 1,
        duration: 600,
        ease: "Cubic.Out",
        onComplete: () => txt.destroy()
      });
    }

    // 💥 EFEITO EXTRA CRÍTICO
    if (isCrit) {
      this.scene.cameras?.main?.shake(120, 0.01);

      this.setTint(0xffd700);
      this.scene.time.delayedCall(100, () => this.clearTint());
    }

    if (this.currentHP <= 0) {
      this.die();
    }
  }

  createHitEffect(isCrit) {
    const color = isCrit ? 0xffff00 : 0xff0000;

    const particles = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: -100, max: 100 },
      scale: { start: 0.5, end: 0 },
      tint: color,
      lifespan: 200,
      quantity: isCrit ? 20 : 10
    });

    particles.setPosition(this.x, this.y);

    this.scene.time.delayedCall(200, () => {
      particles.destroy();
    })
  }

  flashDamage() {
    this.setTint(0xffffff);

    this.scene.time.delayedCall(100, () => {
      if (!this.isDead && this.active) {
        this.applyTint();
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    this.scene.events.emit("enemyKilled", this);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
