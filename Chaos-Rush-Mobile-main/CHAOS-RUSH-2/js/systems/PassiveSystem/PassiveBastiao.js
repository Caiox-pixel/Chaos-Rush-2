export default class PassiveBastiao {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.heatValue = 0; // 0-100
    this.isOverheating = false;
    this.overheatingDuration = 0;
    this.heatBar = null;
    this.heatBarBg = null;
    this.heatText = null;
    this.overheatingAura = null;
    this.tempEvents = [];
  }

  activate() {
    console.log("🔥 PASSIVA – BASTIÃO: VÁLVULA DE SACRIFÍCIO");

    const player = this.player;
    const scene = this.scene;

    this.reset();

    if (this.scene.passiveSystem.current !== "bastiao") return;

    player.heatAccumulation = 0;
    player.heatThreshold = 100;
    player.currentHeat = 0;

    this.ensureHUD();
    this.updateHUDDisplay();

    // Hook para acumular calor ao receber dano
    player.onTakeDamage = (dmg) => {
      if (this.scene.passiveSystem.current !== "bastiao") return;
      this.addHeat(dmg * 0.15); // 15% do dano recebido = calor
    };

    // Hook para acumular calor ao atacar
    player.onAttack = () => {
      if (this.scene.passiveSystem.current !== "bastiao") return;
      this.addHeat(5); // 5 pontos de calor por ataque
    };
  }

  addHeat(amount) {
    if (this.scene.passiveSystem.current !== "bastiao") return;

    const player = this.player;
    const scene = this.scene;

    player.currentHeat = Math.min(player.currentHeat + amount, 100);

    // Verificar Superaquecimento
    if (player.currentHeat >= 100 && !this.isOverheating) {
      this.triggerOverheating();
    }

    this.updateHUDDisplay();
  }

  triggerOverheating() {
    if (this.scene.passiveSystem.current !== "bastiao") return;

    const player = this.player;
    const scene = this.scene;

    this.isOverheating = true;
    this.overheatingDuration = 0;

    // Ganhos durante Superaquecimento
    player.tempSpeedBoost = 1.4; // 40% mais rápido
    player.tempDamageBoost = 1.25; // 25% mais dano

    // Criar aura visual
    this.overheatingAura = scene.add
      .circle(player.x, player.y, 100, 0xff4400, 0.25)
      .setStrokeStyle(2, 0xff6600)
      .setDepth(2);

    const auraUpdate = () => {
      if (!this.overheatingAura) return;
      this.overheatingAura.setPosition(player.x, player.y);
    };

    scene.events.on("update", auraUpdate);

    // Duração máxima: 6 segundos
    const endEvent = scene.time.delayedCall(6000, () => {
      if (this.scene.passiveSystem.current !== "bastiao") return;

      this.isOverheating = false;
      player.currentHeat = 0;
      player.tempSpeedBoost = 1;
      player.tempDamageBoost = 1;

      if (this.overheatingAura) this.overheatingAura.destroy();
      this.overheatingAura = null;

      scene.events.off("update", auraUpdate);
      this.updateHUDDisplay();
    });

    this.tempEvents.push(endEvent);
  }

  ensureHUD() {
    const scene = this.scene;

    if (!scene.heatBar) {
      scene.heatBarBg = scene.add
        .rectangle(100, 70, 200, 10, 0x222222)
        .setOrigin(0)
        .setDepth(1000);

      scene.heatBar = scene.add
        .rectangle(100, 70, 0, 10, 0xff4400)
        .setOrigin(0)
        .setDepth(1001);

      scene.heatText = scene.add.text(310, 65, "Calor: 0%", {
        fontSize: "14px",
        fill: "#ffffff",
        depth: 1001
      }).setDepth(1001);
    }
  }

  updateHUDDisplay() {
    if (this.scene.passiveSystem.current !== "bastiao") return;

    const player = this.player;
    const scene = this.scene;

    const percent = player.currentHeat / 100;

    if (scene.heatBar) scene.heatBar.width = 200 * percent;

    if (scene.heatText) {
      const statusText = this.isOverheating ? "🔥 SUPERAQUECIMENTO!" : "Calor";
      scene.heatText.setText(`${statusText}: ${Math.floor(percent * 100)}%`);

      if (this.isOverheating) {
        scene.heatText.setColor("#ffff00");
      } else if (percent > 0.75) {
        scene.heatText.setColor("#ff6600");
      } else {
        scene.heatText.setColor("#ffffff");
      }
    }
  }

  // Ser chamado a cada frame para atualizar HUD
  updateEveryFrame() {
    if (this.scene.passiveSystem.current !== "bastiao") return;
    this.updateHUDDisplay();
  }

  reset() {
    const scene = this.scene;

    if (this.heatBar) {
      this.heatBar.destroy();
      this.heatBar = null;
    }

    if (this.heatBarBg) {
      this.heatBarBg.destroy();
      this.heatBarBg = null;
    }

    if (this.heatText) {
      this.heatText.destroy();
      this.heatText = null;
    }

    if (this.overheatingAura) {
      this.overheatingAura.destroy();
      this.overheatingAura = null;
    }

    this.tempEvents.forEach((ev) => ev.remove());
    this.tempEvents = [];

    this.heatValue = 0;
    this.isOverheating = false;
  }
}
