let particulas = [];
let barreraActiva = true;
let tiempoInicio;
let boton;

const CANTIDAD_POR_GAS = 90;
const RADIO = 5;

function setup() {
  createCanvas(800, 420);
  tiempoInicio = millis();

  // Gas azul: comienza en el lado izquierdo.
  for (let i = 0; i < CANTIDAD_POR_GAS; i++) {
    particulas.push(
      new Particula(
        random(RADIO, width / 2 - 12),
        random(RADIO, height - RADIO),
        color(50, 145, 255)
      )
    );
  }

  // Gas naranja: comienza en el lado derecho.
  for (let i = 0; i < CANTIDAD_POR_GAS; i++) {
    particulas.push(
      new Particula(
        random(width / 2 + 12, width - RADIO),
        random(RADIO, height - RADIO),
        color(255, 130, 45)
      )
    );
  }

  boton = createButton("Reiniciar");
  boton.mousePressed(reiniciar);
}

function draw() {
  background(245);

  dibujarRecipiente();

  // La barrera se retira después de dos segundos.
  if (millis() - tiempoInicio > 2000) {
    barreraActiva = false;
  }

  for (let particula of particulas) {
    particula.actualizar();
    particula.mostrar();
  }

  if (barreraActiva) {
    dibujarBarrera();
  }

  dibujarTexto();
}

function dibujarRecipiente() {
  noFill();
  stroke(40);
  strokeWeight(4);
  rect(2, 2, width - 4, height - 4, 8);
}

function dibujarBarrera() {
  stroke(70);
  strokeWeight(8);
  line(width / 2, 4, width / 2, height - 4);
}

function dibujarTexto() {
  noStroke();
  fill(20);
  textAlign(CENTER, TOP);
  textSize(18);

  if (barreraActiva) {
    text("Dos gases separados", width / 2, 14);
  } else {
    text("Los gases se mezclan espontáneamente", width / 2, 14);
  }
}

function reiniciar() {
  particulas = [];
  barreraActiva = true;
  tiempoInicio = millis();

  for (let i = 0; i < CANTIDAD_POR_GAS; i++) {
    particulas.push(
      new Particula(
        random(RADIO, width / 2 - 12),
        random(RADIO, height - RADIO),
        color(50, 145, 255)
      )
    );

    particulas.push(
      new Particula(
        random(width / 2 + 12, width - RADIO),
        random(RADIO, height - RADIO),
        color(255, 130, 45)
      )
    );
  }
}

class Particula {
  constructor(x, y, colorParticula) {
    this.posicion = createVector(x, y);
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(1, 2.2));
    this.colorParticula = colorParticula;
  }

  actualizar() {
    this.posicion.add(this.velocidad);

    // Colisiones con las paredes del recipiente.
    if (
      this.posicion.x <= RADIO ||
      this.posicion.x >= width - RADIO
    ) {
      this.velocidad.x *= -1;
      this.posicion.x = constrain(
        this.posicion.x,
        RADIO,
        width - RADIO
      );
    }

    if (
      this.posicion.y <= RADIO ||
      this.posicion.y >= height - RADIO
    ) {
      this.velocidad.y *= -1;
      this.posicion.y = constrain(
        this.posicion.y,
        RADIO,
        height - RADIO
      );
    }

    // Mientras existe la barrera, ninguna partícula puede cruzarla.
    if (barreraActiva) {
      const centro = width / 2;

      if (
        this.posicion.x < centro &&
        this.posicion.x + RADIO >= centro
      ) {
        this.posicion.x = centro - RADIO;
        this.velocidad.x = -abs(this.velocidad.x);
      }

      if (
        this.posicion.x > centro &&
        this.posicion.x - RADIO <= centro
      ) {
        this.posicion.x = centro + RADIO;
        this.velocidad.x = abs(this.velocidad.x);
      }
    }

    // Pequeña variación aleatoria para simular movimiento molecular.
    this.velocidad.rotate(random(-0.035, 0.035));
  }

  mostrar() {
    noStroke();
    fill(this.colorParticula);
    circle(this.posicion.x, this.posicion.y, RADIO * 2);
  }
}