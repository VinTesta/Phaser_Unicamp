/**
 * 3 personagens disponíveis:
 * feiticeira
 * cavaleira
 * mosqueteira
 */
const personagem = "feiticeira";
const larguraJogo = 1300;
const alturaJogo = 600;
const tempoParaGerarFogos = 5000;
const gameAttributes = {
  score: 0,
};

class CenaPrincipal extends Phaser.Scene {
  player;
  triggers;
  isJumping = false;
  isShooting = false;
  flechas;

  constructor() {
    super({ key: "CenaPrincipal" });
  }

  preload() {
    this.load.spritesheet("run", `assets/${personagem}/Run.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });

    this.load.spritesheet("idle", `assets/${personagem}/Idle.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });

    this.load.spritesheet("jump", `assets/${personagem}/Jump.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });

    this.load.spritesheet("arrow", "assets/arrow.png", {
      frameWidth: 204,
      frameHeight: 204,
    });

    this.load.image("tijolos", "assets/tijolos.png");
    this.load.image("moeda", "assets/moeda.png");
    this.load.image("background", "assets/Undersea.png");
    this.load.image("fire", "assets/fire.png");
  }

  create() {
    this.add
      .image(
        this.game.config.width / 2,
        this.game.config.height / 2.3,
        "background"
      )
      .setOrigin(0.5, 0.5)
      .setScale(.7);
    // Chama a função para gerar as animações
    this.criarAnimacoes();

    // Cria um grupo para as flechas
    this.flechas = this.physics.add.group();

    gameAttributes.scoreText = this.add
      .text(this.renderer.width, 0, "Score: 0", {
        fontSize: "32px",
        fill: "#ffffff",
      })
      .setOrigin(1, 0);

    // Cria nosso player
    this.player = this.physics.add.sprite(100, 100, "run_player");
    this.player.setCollideWorldBounds(true).setScale(0.5);
    this.player.body.setSize(50, 70).setOffset(40, 60);

    // Inicia a animação no player
    this.player.play("idle", true);

    // Cria os triggers de movimento
    this.triggers = this.input.keyboard.createCursorKeys();

    const {moedas, geradorDeMoedas} = this.criarMoedas();

    const {fogos, geradorDeFogos} = this.criarFogos();

    geradorDeFogos();
    geradorDeMoedas();
    geradorDeMoedas();

    this.time.addEvent({
      delay: tempoParaGerarFogos,
      callback: geradorDeFogos,
      callbackScope: this,
      loop: true,
    });

    // Adicionando o colisor entre o personagem principal e as moedas
    this.physics.add.overlap(this.player, moedas, (player, moeda) => {
      moeda.destroy();
      geradorDeMoedas();

      // Adiciona 1 ponto ao score
      gameAttributes.score += 1;
      gameAttributes.scoreText.setText(`Score: ${gameAttributes.score}`);
    });

    this.physics.add.collider(this.flechas, moedas, (flecha, moeda) => {
      flecha.destroy();
      moeda.destroy();
      geradorDeMoedas();
      gameAttributes.score += 1;
      gameAttributes.scoreText.setText(`Score: ${gameAttributes.score}`);
    });

    this.physics.add.collider(this.flechas, fogos, (flecha, fogo) => {
      flecha.destroy();
      fogo.destroy();

      // Caso queira mais dificuldade, você pode descomentar a linha abaixo
      // geradorDeFogos();
    });

    this.physics.add.collider(this.player, fogos, (player, fogo) => {
      this.player.setPosition(100, 100);
      fogo.destroy();
      fogos.getChildren().forEach((fogo) => fogo.destroy());

      // Remove 5 pontos do score
      gameAttributes.score -= 10;
      gameAttributes.scoreText.setText(`Score: ${gameAttributes.score}`);
    });

    platformsArray.forEach((platform) => {
      // Adiciona a plataforma no jogo
      const platformDeclared = this.physics.add
        .staticImage(platform.x, platform.y, platform.sprite)
        .setScale(0.5)
        .setTint(0x088745);
      platformDeclared.body.setSize(79, 26).setOffset(39.5, 13);

      // Adiciona colisão entre o player e a plataforma
      this.physics.add.collider(this.player, platformDeclared);

      // Adiciona colisão entre as moedas e a plataforma
      this.physics.add.collider(moedas, platformDeclared);

      // Adiciona colisão entre os fogos e a plataforma
      this.physics.add.collider(fogos, platformDeclared);
    });
  }

  update() {
    if (gameAttributes.score >= 20) this.ganhaOJogo();
    if (gameAttributes.score < 0) this.perdeOJogo();
    if (this.player.body.blocked.down) this.isJumping = false;

    this.player.setVelocityX(0);

    if (this.triggers.right.isDown) this.andarParaDireita();
    else if (this.triggers.left.isDown) this.andarParaEsquerda();

    if (
      !this.triggers.right.isDown &&
      !this.triggers.left.isDown &&
      !this.triggers.up.isDown &&
      !this.isJumping
    ) {
      this.player.setVelocityX(0);
      this.currentAnim = "idle";
    }

    if (this.triggers.up.isDown && !this.isJumping) this.pular();

    if (this.triggers.down.isDown) this.player.setVelocityY(200);

    if (this.triggers.space.isDown && !this.isShooting) this.atirarFlecha();

    this.player.play(this.isJumping ? "jump" : this.currentAnim, true);
  }

  criarFogos() {
    const fogos = this.physics.add.group();

    const geradorDeFogos = () => {
      const fogo = fogos.create(
        Math.random() * larguraJogo,
        Math.random() * 400,
        "fire"
      );
      fogo.flipY = true;
      fogo.body.onWorldBounds = true;
      fogo.body.setCollideWorldBounds(true);
      fogo.setBounce(1).setScale(0.5);
      fogo.setVelocityX(Math.random() * 200 - 100);
    };

    return { fogos, geradorDeFogos };
  }
 
  criarMoedas() {
    const moedas = this.physics.add.group();

    const geradorDeMoedas = () => {
      const moeda = moedas.create(
        Math.random() * larguraJogo,
        Math.random() * 400,
        "moeda"
      );
      moeda.body.onWorldBounds = true;
      moeda.body.setCollideWorldBounds(true);
      moeda.setBounce(0.7).setScale(0.5);

      moeda.body.world.on(
        "worldbounds",
        function (body) {
          if (body.gameObject === this) {
            this.destroy();
            geradorDeMoedas();
          }
        },
        moeda
      );
    };

    return { moedas, geradorDeMoedas };
  }

  atirarFlecha() {
    // Cria a flecha
    const flecha = this.flechas
      .create(this.player.x, this.player.y, "arrow")
      .setScale(0.2);
    flecha.setTint(0x00d9ff);
    this.isShooting = true;

    flecha.setVelocity(this.player.flipX ? -700 : 700, -100);

    flecha.flipX = !this.player.flipX;
    flecha.play("shotArrow", true);

    // Inicia um timer para que o jogador possa atirar novamente
    setTimeout(() => {
      this.isShooting = false;
    }, 1000);
  }

  pular() {
    this.isJumping = true;
    this.player.setVelocityY(-350);
    this.currentAnim = "jump";
  }

  andarParaDireita() {
    this.player.setVelocityX(200);
    this.player.flipX = false;
    this.currentAnim = "run";
  }

  andarParaEsquerda() {
    this.player.setVelocityX(-200);
    this.player.flipX = true;
    this.currentAnim = "run";
  }

  perdeOJogo() {
    this.physics.pause();
    // Adiciona o texto de game over
    this.add
      .text(
        this.renderer.width / 2,
        this.renderer.height / 2,
        "F! Você perdeu!",
        {
          fontSize: "32px",
          fill: "#ffffff",
        }
      )
      .setOrigin(0.5, 0.5);

    // Adiciona o texto de clique para recomeçar
    this.add
      .text(
        this.renderer.width / 2,
        this.renderer.height / 2 + 100,
        "Clique para recomeçar",
        { fontSize: "32px", fill: "#ffffff" }
      )
      .setOrigin(0.5, 0.5);

    // Adiciona o evento de clique para reiniciar o jogo
    this.input.once("pointerup", () => {
      gameAttributes.score = 0;
      this.scene.restart();
    });
  }

  ganhaOJogo() {
    this.physics.pause();
    // Adiciona o texto de vitória
    this.add
      .text(
        this.renderer.width / 2,
        this.renderer.height / 2,
        "Parabéns, você ganhou!!!",
        {
          fontSize: "32px",
          fill: "#ffffff",
        }
      )
      .setOrigin(0.5, 0.5);

    this.add
      .text(
        this.renderer.width / 2,
        this.renderer.height / 2 + 100,
        "Clique para recomeçar",
        { fontSize: "32px", fill: "#ffffff" }
      )
      .setOrigin(0.5, 0.5);
    
    // Adiciona o evento de clique para reiniciar o jogo
    this.input.once("pointerup", () => {
      gameAttributes.score = 0;
      this.scene.restart();
    });
  }

  // Função para criar as animações
  criarAnimacoes() {
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("run", {
        start: 0,
        end: 7,
      }),
      frameRate: 14,
      repeat: -1,
    });

    this.anims.create({
      key: "shotArrow",
      frames: this.anims.generateFrameNumbers("arrow", {
        start: 0,
        end: 5,
      }),
      frameRate: 5,
      repeat: -1,
    });

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("idle", {
        start: 0,
        end: 4,
      }),
      frameRate: 2,
      repeat: -1,
    });

    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("jump", {
        start: 2,
        end: 7,
      }),
      frameRate: 2,
      repeat: -1,
    });
  }
}

// Array que contém as plataformas do jogo
const platformsArray = [
  {
    x: 200,
    y: 500,
    sprite: "tijolos",
  },
  {
    x: 279,
    y: 500,
    sprite: "tijolos",
  },
  {
    x: 358,
    y: 500,
    sprite: "tijolos",
  },
  {
    x: 150,
    y: 400,
    sprite: "tijolos",
  },
  {
    x: 71,
    y: 400,
    sprite: "tijolos",
  },
  {
    x: 516,
    y: 400,
    sprite: "tijolos",
  },
  {
    x: 1100,
    y: 400,
    sprite: "tijolos",
  },
  {
    x: 1179,
    y: 400,
    sprite: "tijolos",
  },
  {
    x: 516,
    y: 400,
    sprite: "tijolos",
  },
  {
    x: 788,
    y: 500,
    sprite: "tijolos",
  },
  {
    x: 375,
    y: 300,
    sprite: "tijolos",
  },
  {
    x: 788,
    y: 300,
    sprite: "tijolos",
  },
  {
    x: 867,
    y: 300,
    sprite: "tijolos",
  },
  {
    x: 946,
    y: 300,
    sprite: "tijolos",
  },
  {
    x: 986,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 1065,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 1144,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 1223,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 1302,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 516,
    y: 200,
    sprite: "tijolos",
  },
  // +79
  {
    x: 595,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 674,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 753,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 250,
    y: 200,
    sprite: "tijolos",
  },
  // -79PX
  {
    x: 171,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 92,
    y: 200,
    sprite: "tijolos",
  },
  {
    x: 13,
    y: 200,
    sprite: "tijolos",
  },
];

// Configurações do jogo
const config = {
  type: Phaser.AUTO,
  width: larguraJogo,
  height: alturaJogo,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [CenaPrincipal],
};

// Inicializa o jogo
const game = new Phaser.Game(config);
