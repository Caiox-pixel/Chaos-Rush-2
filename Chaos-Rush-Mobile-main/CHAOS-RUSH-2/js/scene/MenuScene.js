import { fetchRankings } from "../systems/RankingService.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('menuBg', 'assets/img/menu-init-1.png');
    this.load.audio('menuMusic', 'assets/music/menu-music1.mp3');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const hasRankingColumn = width >= 1100;
    const isCompact = !hasRankingColumn || height < 760;
    const titleY = isCompact ? 58 : 86;
    const subtitleY = titleY + 48;
    const classPanelX = hasRankingColumn ? width * 0.34 : width / 2;
    const classPanelY = hasRankingColumn ? height / 2 + 38 : Math.min(330, height * 0.43);
    const classPanelWidth = Math.min(hasRankingColumn ? 620 : 760, width - 32);
    const classPanelHeight = hasRankingColumn ? Math.min(520, height - 210) : Math.min(330, height * 0.46);
    const classButtonWidth = Math.max(280, classPanelWidth - 70);
    const classButtonHeight = isCompact ? 72 : 80;
    const classButtonGap = isCompact ? 82 : 92;

    // Carregar configurações de áudio do localStorage
    this.musicOn = localStorage.getItem('musicOn') !== 'false'; // default true
    this.soundOn = localStorage.getItem('soundOn') !== 'false'; // default true

    // Adicionar música de fundo
    this.music = this.sound.add('menuMusic', { loop: true, volume: 0.5 });
    if (this.musicOn) {
      this.music.play();
    }

    this.bgFar = this.add
      .tileSprite(0, 0, width, height, 'menuBg')
      .setOrigin(0)
      .setScrollFactor(0);

    this.bgNear = this.add
      .tileSprite(0, 0, width, height, 'menuBg')
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(0.35)
      .setDepth(-1);

    this.cameras.main.setBackgroundColor('#080a10');

    this.add
      .text(width / 2, titleY, 'CHAOS RUSH', {
        fontSize: `${Math.min(64, Math.max(40, width * 0.09))}px`,
        fill: '#00ffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(width / 2, subtitleY, 'Fractured Realms', {
        fontSize: `${isCompact ? 16 : 20}px`,
        fill: '#cccccc',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Botões de configuração de áudio no canto superior direito
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonY = 30;
    const musicButtonX = width - buttonWidth - 10;
    const soundButtonX = width - (buttonWidth * 2) - 20;

    // Botão Música
    this.musicButton = this.add
      .rectangle(musicButtonX, buttonY, buttonWidth, buttonHeight, 0x111122, 0.8)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    this.musicText = this.add
      .text(musicButtonX, buttonY, `Música: ${this.musicOn ? 'ON' : 'OFF'}`, {
        fontSize: '16px',
        fill: '#00ffff',
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.musicButton.on('pointerover', () => this.musicButton.setFillStyle(0x00ffff, 0.3));
    this.musicButton.on('pointerout', () => this.musicButton.setFillStyle(0x111122, 0.8));
    this.musicButton.on('pointerdown', () => {
      this.musicOn = !this.musicOn;
      localStorage.setItem('musicOn', this.musicOn);
      this.musicText.setText(`Música: ${this.musicOn ? 'ON' : 'OFF'}`);
      if (this.musicOn) {
        this.music.play();
      } else {
        this.music.stop();
      }
    });

    // // Botão Som
    // this.soundButton = this.add
    //   .rectangle(soundButtonX, buttonY, buttonWidth, buttonHeight, 0x111122, 0.8)
    //   .setStrokeStyle(2, 0x00ffff)
    //   .setInteractive({ useHandCursor: true })
    //   .setDepth(10);

    // this.soundText = this.add
    //   .text(soundButtonX, buttonY, `Som: ${this.soundOn ? 'ON' : 'OFF'}`, {
    //     fontSize: '16px',
    //     fill: '#00ffff',
    //   })
    //   .setOrigin(0.5)
    //   .setDepth(11);

    // this.soundButton.on('pointerover', () => this.soundButton.setFillStyle(0x00ffff, 0.3));
    // this.soundButton.on('pointerout', () => this.soundButton.setFillStyle(0x111122, 0.8));
    // this.soundButton.on('pointerdown', () => {
    //   this.soundOn = !this.soundOn;
    //   localStorage.setItem('soundOn', this.soundOn);
    //   this.soundText.setText(`Som: ${this.soundOn ? 'ON' : 'OFF'}`);
    //   // Para sons, você pode implementar lógica adicional aqui ou em outras cenas
    // });

    const painel = this.add
      .rectangle(classPanelX, classPanelY, classPanelWidth, classPanelHeight, 0x000000, 0.55)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x00ffff)
      .setDepth(5);
      
      this.add
      .text(width / 2, subtitleY / 0.45, 'Pronto pra jogar?', {
        fontSize: `${Math.min(45, Math.max(35, width * 0.7))}px`,
        fontStyle: '900',
        fill: '#ffff00',
      })
      .setOrigin(1)
      .setDepth(10) // z-index

    const classes = [
      {
        Key: 'alquimista',
        name: 'A Alquimista Espectral',
        desc: 'Manipula frascos instáveis que causam efeitos aleatórios.\nCarregue sua passiva e acabe com seus inimigos.',
      },
      {
        Key: 'coveiro',
        name: 'O Coveiro Profano',
        desc: 'Profana a terra com a Foice Enferrujada, aplicando Podridão e Lentidão aos inimigos.',
      },
      {
        Key: 'sentinela',
        name: 'A Sentinela do Sino',
        desc: 'Toca o Sino da Purificação, causando dano em área e empurrando inimigos.\nDano bônus quando empurra inimigos.',
        estreia: 'EM BREVE!!!!',
      },
    ];

    const startY = classPanelY - classButtonGap;

    classes.forEach((cls, i) => {
      const btnY = startY + i * classButtonGap;

      const btn = this.add
        .rectangle(classPanelX, btnY, classButtonWidth, classButtonHeight, 0x111122, 0.74)
        .setStrokeStyle(2, 0x00ffff)
        .setInteractive({ useHandCursor: true })
        .setDepth(6);

      this.add
        .text(btn.x, btnY - classButtonHeight * 0.24, cls.name, {
          fontSize: `${isCompact ? 17 : 22}px`,
          fill: '#00ffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(7);

      this.add
        .text(btn.x, btnY + classButtonHeight * 0.18, cls.desc, {
          fontSize: `${isCompact ? 12 : 14}px`,
          fill: '#cccccc',
          align: 'center',
          wordWrap: { width: classButtonWidth - 50 },
        })
        .setOrigin(0.5)
        .setDepth(7);

      btn.on('pointerover', () => btn.setFillStyle(0x00ffff, 0.3));
      btn.on('pointerout', () => btn.setFillStyle(0x111122, 0.7));
      btn.on('pointerdown', () => {
        this.scene.start('MainScene', { selectedClassKey: cls.Key });
      });

      if (cls.estreia) {
        this.add
          .text(btn.x - classButtonWidth / 2 + 14, btnY - classButtonHeight / 2 + 8, cls.estreia, {
            fontSize: `${isCompact ? 13 : 16}px`,
            fill: '#ffff00',
            fontStyle: 'bold',
          })
          .setOrigin(0)
          .setDepth(7);
      }
    });

    this.add
      .text(classPanelX, classPanelY + classPanelHeight / 2 - 28, 'Pressione uma classe para começar!', {
        fontSize: `${isCompact ? 18 : 20}px`,
        fill: '#FFF700',
      })
      .setOrigin(0.5)
      .setDepth(7);

    this.createRankingPanel(width, height, {
      hasRankingColumn,
      classPanelY,
      classPanelHeight,
      isCompact,
    });

    this.scale.on('resize', this.resize, this);
  }
  
  // SISTEMA DE RANKING
  createRankingPanel(width, height, layout) {
    const { hasRankingColumn, classPanelY, classPanelHeight, isCompact } = layout;
    const panelWidth = hasRankingColumn ? Math.min(380, width * 0.29) : Math.min(760, width - 32);
    const bottomSpace = height - (classPanelY + classPanelHeight / 2) - 58;
    const panelHeight = hasRankingColumn ? classPanelHeight : Math.max(175, Math.min(235, bottomSpace));
    const panelX = hasRankingColumn ? width * 0.78 : width / 2;
    const panelY = hasRankingColumn
      ? classPanelY
      : Math.min(height - panelHeight / 2 - 14, classPanelY + classPanelHeight / 2 + 48 + panelHeight / 2);

    this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0.64)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xfff700)
      .setDepth(8);

    this.add.text(panelX, panelY - panelHeight / 2 + 30, 'RANKING', {
      fontSize: `${isCompact ? 20 : 26}px`,
      fill: '#fff700',
      fontStyle: 'bold',
    })
      .setOrigin(0.5)
      .setDepth(9);

    const headerY = panelY - panelHeight / 2 + (isCompact ? 52 : 70);
    this.add.text(panelX - panelWidth * 0.42, headerY, '#', {
      fontSize: `${isCompact ? 12 : 14}px`,
      fill: '#00ffff',
      fontStyle: 'bold',
    }).setDepth(9);

    this.add.text(panelX - panelWidth * 0.32, headerY, 'Jogador', {
      fontSize: `${isCompact ? 12 : 14}px`,
      fill: '#00ffff',
      fontStyle: 'bold',
    }).setDepth(9);

    this.add.text(panelX + panelWidth * 0.12, headerY, 'Pontos', {
      fontSize: `${isCompact ? 12 : 14}px`,
      fill: '#00ffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(9);

    this.add.text(panelX + panelWidth * 0.32, headerY, 'Lv', {
      fontSize: `${isCompact ? 12 : 14}px`,
      fill: '#00ffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(9);

    this.rankingStatusText = this.add.text(panelX, panelY, 'Carregando ranking...', {
      fontSize: `${isCompact ? 13 : 16}px`,
      fill: '#cccccc',
      align: 'center',
      wordWrap: { width: panelWidth - 40 },
    })
      .setOrigin(0.5)
      .setDepth(9);

    this.loadRankingRows(panelX, panelY, panelWidth, panelHeight, isCompact);
  }

  async loadRankingRows(panelX, panelY, panelWidth, panelHeight, isCompact) {
    const rows = await fetchRankings(isCompact ? 5 : 10);

    this.rankingStatusText?.destroy();

    if (!rows.length) {
      this.rankingStatusText = this.add.text(panelX, panelY, 'Nenhuma pontuacao registrada ainda.', {
        fontSize: `${isCompact ? 13 : 16}px`,
        fill: '#cccccc',
        align: 'center',
        wordWrap: { width: panelWidth - 40 },
      })
        .setOrigin(0.5)
        .setDepth(9);
      return;
    }

    const startY = panelY - panelHeight / 2 + (isCompact ? 78 : 100);
    const rowGap = Math.min(isCompact ? 27 : 36, (panelHeight - (isCompact ? 95 : 120)) / rows.length);

    rows.forEach((row, index) => {
      const y = startY + index * rowGap;
      const name = String(row.nome).slice(0, isCompact ? 12 : 14);
      const fontSize = `${isCompact ? 12 : 14}px`;

      this.add.text(panelX - panelWidth * 0.42, y, `${row.position}`, {
        fontSize,
        fill: '#ffffff',
      }).setDepth(9);

      this.add.text(panelX - panelWidth * 0.32, y, name, {
        fontSize,
        fill: '#ffffff',
      }).setDepth(9);

      this.add.text(panelX + panelWidth * 0.12, y, `${row.maxPontuacao}`, {
        fontSize,
        fill: '#fff700',
      }).setOrigin(0.5, 0).setDepth(9);

      this.add.text(panelX + panelWidth * 0.34, y, `${row.maxLevel}`, {
        fontSize,
        fill: '#00ffff',
      }).setOrigin(0.5, 0).setDepth(9);
    });
  }

  resize(gameSize) {
    const { width, height } = gameSize;
    this.bgFar.setSize(width, height);
    this.bgNear.setSize(width, height);
  }

  update(time, delta) {
    const speedFar = 0.03 * delta;
    const speedNear = 0.08 * delta;

    this.bgFar.tilePositionX += speedFar;
    this.bgNear.tilePositionX -= speedNear;
  }
}
