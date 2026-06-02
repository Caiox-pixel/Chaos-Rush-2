import PassiveAlquimista from "../../systems/PassiveSystem/PassiveAlquimista.js";
import PassiveCoveiro from "../../systems/PassiveSystem/PassiveCoveiro.js";
import PassiveBastiao from "../../systems/PassiveSystem/PassiveBastiao.js";

export const PLAYER_CLASSES = {
  alquimista: {
    key: "alquimista",
    texture: "alquimista",
    frame: 0,

    stats: {
      maxHP: 90,
      critChance: 0.05,
      critDamage: 1.6,
      projectileSpeed: 1.1,
      globalCD: 0.95,
      aoe: 1.15,
      xpGain: 1.1,
      pickupRadius: 1.3,
      dotDamageBonus: 0.15,
      debuffDurationMultiplier: 1.2,
      auraRange: 120
    },

animations: {
  walk: {
    start: 0,
    end: 5,
    frameRate: 8,
    end: 4,
    frameRate: 4,
    repeat: -1
  },

  throw: {
    start: 6,
    end: 8,
    frameRate: 10,
    repeat: 0
  },

  throwFollow: {
    start: 9,
    end: 11,
    frameRate: 9,
    repeat: 0
  },

  idle: {
    start: 0,
    end: 0,
    frameRate: 1,
    repeat: -1
  },




},
passive: PassiveAlquimista,
    weaponKey: "frascoInstavel",
  spriteWidth: 117,
  spriteHeight: 176,
  hitboxWidth: 42,
  hitboxHeight: 58,
  spriteScale: 1
  },

  coveiro: {
    key: "coveiro",
    texture: "coveiro",
    frame: 0,

    stats: {
      maxHP: 120,
      armor: 2,
      lifesteal: 0.05,
      dotDamageBonus: 0.3,
      debuffDurationMultiplier: 1.4,
      auraRange: 110
    },

    animations: {
      idle: { start: 0, end: 0, frameRate: 1, repeat: -1 },
      walk: { start: 0, end: 13, frameRate: 8, repeat: -1 }
    },

    passive: PassiveCoveiro,
    weaponKey: "foiceEnferrujada",
    spriteWidth: 10,
    spriteHeight: 10,
    hitboxWidth: 200,
    hitboxHeight: 200,
    spriteScale: 0.8
  },

  bastiao: {
    key: "bastiao",
    texture: "bastiao",
    frame: 0,

    stats: {
      maxHP: 160,
      armor: 6,
      damageMultiplier: 1.15,
      attackSpeed: 0.8,
      auraRange: 140
    },

    animations: {
      idle: { start: 0, end: 0, frameRate: 1, repeat: -1 },
      walk: { start: 0, end: 5, frameRate: 4, repeat: -1 }
    },

    passive: PassiveBastiao,
    weaponKey: "pilarCombustao",
    spriteWidth: 128,
    spriteHeight: 128,
    hitboxWidth: 60,
    hitboxHeight: 80,
    spriteScale: 1.1
  }
};
