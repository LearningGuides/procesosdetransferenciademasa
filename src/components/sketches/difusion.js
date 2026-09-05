/*
  Convección, difusión y reacción de primer orden

  Ecuación:

  ∂CA/∂t =
  -ux ∂CA/∂x
  + D ∂²CA/∂x²
  - k CA

  Convección: desplazamiento colectivo
  Difusión: movimiento aleatorio
  Reacción: desaparición de partículas
*/

const BOX = {
  x: 40,
  y: 135,
  w: 1020,
  h: 190
};

const NUM_CELLS = 100;
const INITIAL_PARTICLES = 1600;

let particles = [];

let concentration = [];
let gradient = [];
let curvature = [];

let convectionTerm = [];
let diffusionTerm = [];
let reactionTerm = [];
let totalTerm = [];

let velocitySlider;
let diffusionSlider;
let reactionSlider;
let probeSlider;

let pauseButton;
let resetButton;

let paused = false;
let simulationTime = 0;

function setup() {
  createCanvas(1100, 860);

  velocitySlider = createSlider(-3, 3, 1, 0.1);
  velocitySlider.position(130, 48);
  velocitySlider.size(150);

  diffusionSlider = createSlider(0, 3, 0.5, 0.05);
  diffusionSlider.position(390, 48);
  diffusionSlider.size(150);

  reactionSlider = createSlider(0, 0.5, 0.05, 0.005);
  reactionSlider.position(650, 48);
  reactionSlider.size(150);

  probeSlider = createSlider(0, NUM_CELLS - 1, 50, 1);
  probeSlider.position(130, 88);
  probeSlider.size(300);

  pauseButton = createButton("Pausar");
  pauseButton.position(850, 43);
  pauseButton.mousePressed(togglePause);

  resetButton = createButton("Reiniciar");
  resetButton.position(930, 43);
  resetButton.mousePressed(resetSimulation);

  initializeArrays();
  resetSimulation();
}

function draw() {
  background(245);

  const ux = velocitySlider.value();
  const D = diffusionSlider.value();
  const k = reactionSlider.value();

  const dt = min(deltaTime / 1000, 0.04);

  if (!paused) {
    updateParticles(ux, D, k, dt);
    simulationTime += dt;
  }

  calculateConcentration();
  calculateSpatialDerivatives();
  calculateEquationTerms(ux, D, k);

  drawHeader(ux, D, k);
  drawParticleDomain(ux);
  drawGraphs();
  drawProbePanel(ux, D, k);
}

function initializeArrays() {
  concentration = new Array(NUM_CELLS).fill(0);
  gradient = new Array(NUM_CELLS).fill(0);
  curvature = new Array(NUM_CELLS).fill(0);

  convectionTerm = new Array(NUM_CELLS).fill(0);
  diffusionTerm = new Array(NUM_CELLS).fill(0);
  reactionTerm = new Array(NUM_CELLS).fill(0);
  totalTerm = new Array(NUM_CELLS).fill(0);
}

function resetSimulation() {
  particles = [];
  simulationTime = 0;
  paused = false;

  if (pauseButton) {
    pauseButton.html("Pausar");
  }

  /*
    Distribución inicial gaussiana.

    La concentración comienza localizada cerca
    del lado izquierdo del dominio.
  */
  for (let i = 0; i < INITIAL_PARTICLES; i++) {
    let normalizedX = randomGaussian(0.28, 0.055);
    normalizedX = constrain(normalizedX, 0, 1);

    particles.push({
      x: BOX.x + normalizedX * BOX.w,
      y: random(BOX.y + 18, BOX.y + BOX.h - 18),
      diameter: random(3, 7)
    });
  }

  initializeArrays();
}

function togglePause() {
  paused = !paused;
  pauseButton.html(paused ? "Continuar" : "Pausar");
}

function updateParticles(ux, D, k, dt) {
  const convectionScale = 55;
  const diffusionScale = 22;

  /*
    Para una reacción de primer orden:

    dCA/dt = -kCA

    La probabilidad de supervivencia durante dt es:

    P = exp(-k dt)
  */
  const survivalProbability = exp(-k * dt);

  const survivingParticles = [];

  for (const particle of particles) {
    // Convección
    const convectiveDisplacement =
      ux * convectionScale * dt;

    // Difusión browniana
    const diffusiveDisplacement =
      randomGaussian() *
      sqrt(2 * D * dt) *
      diffusionScale;

    particle.x +=
      convectiveDisplacement +
      diffusiveDisplacement;

    /*
      Condiciones periódicas:
      una partícula que sale por un extremo
      reaparece por el extremo contrario.
    */
    if (particle.x > BOX.x + BOX.w) {
      particle.x -= BOX.w;
    }

    if (particle.x < BOX.x) {
      particle.x += BOX.w;
    }

    /*
      La partícula permanece únicamente
      si todavía no ha reaccionado.
    */
    if (random() < survivalProbability) {
      survivingParticles.push(particle);
    }
  }

  particles = survivingParticles;
}

function calculateConcentration() {
  concentration.fill(0);

  const cellWidth = BOX.w / NUM_CELLS;

  /*
    Se cuentan las partículas en cada celda.
    Este número representa CA(x).
  */
  for (const particle of particles) {
    let cell = floor(
      (particle.x - BOX.x) / cellWidth
    );

    cell = constrain(cell, 0, NUM_CELLS - 1);
    concentration[cell]++;
  }

  concentration = smoothArray(concentration, 3);
}

function calculateSpatialDerivatives() {
  const dx = BOX.w / NUM_CELLS;

  for (let i = 0; i < NUM_CELLS; i++) {
    const left =
      i === 0 ? NUM_CELLS - 1 : i - 1;

    const right =
      i === NUM_CELLS - 1 ? 0 : i + 1;

    /*
      Primera derivada:

      ∂CA/∂x ≈
      [CA(i+1) - CA(i-1)] / 2Δx
    */
    gradient[i] =
      (
        concentration[right] -
        concentration[left]
      ) /
      (2 * dx);

    /*
      Segunda derivada:

      ∂²CA/∂x² ≈
      [CA(i+1) - 2CA(i) + CA(i-1)] / Δx²
    */
    curvature[i] =
      (
        concentration[right] -
        2 * concentration[i] +
        concentration[left]
      ) /
      (dx * dx);
  }
}

function calculateEquationTerms(ux, D, k) {
  for (let i = 0; i < NUM_CELLS; i++) {
    /*
      Término convectivo que aparece
      en el lado derecho de la ecuación.
    */
    convectionTerm[i] =
      -ux * gradient[i];

    // Término difusivo
    diffusionTerm[i] =
      D * curvature[i];

    // Término reactivo
    reactionTerm[i] =
      -k * concentration[i];

    /*
      Cambio total:

      ∂CA/∂t =
      -ux ∂CA/∂x
      + D ∂²CA/∂x²
      - kCA
    */
    totalTerm[i] =
      convectionTerm[i] +
      diffusionTerm[i] +
      reactionTerm[i];
  }
}

function smoothArray(values, radius) {
  const result =
    new Array(values.length).fill(0);

  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;

    for (
      let offset = -radius;
      offset <= radius;
      offset++
    ) {
      let index = i + offset;

      if (index < 0) {
        index += values.length;
      }

      if (index >= values.length) {
        index -= values.length;
      }

      sum += values[index];
      count++;
    }

    result[i] = sum / count;
  }

  return result;
}

function drawHeader(ux, D, k) {
  fill(20);
  noStroke();

  textSize(22);
  textStyle(BOLD);
  text(
    "Transporte por convección, difusión y reacción",
    40,
    30
  );

  textStyle(NORMAL);
  textSize(14);

  text("Velocidad uₓ:", 40, 64);
  text(nf(ux, 1, 1), 290, 64);

  text("Difusión D:", 320, 64);
  text(nf(D, 1, 2), 550, 64);

  text("Reacción k:", 580, 64);
  text(nf(k, 1, 3), 810, 64);

  text("Punto de medición:", 40, 104);

  fill(60);
  textSize(13);

  text(
    "∂Cₐ/∂t = −uₓ ∂Cₐ/∂x + D ∂²Cₐ/∂x² − kCₐ",
    500,
    105
  );
}

function drawParticleDomain(ux) {
  const selectedCell = probeSlider.value();
  const cellWidth = BOX.w / NUM_CELLS;

  stroke(30);
  strokeWeight(2);
  fill(255);

  rect(BOX.x, BOX.y, BOX.w, BOX.h);

  // Celda de medición
  noStroke();
  fill(255, 210, 40, 70);

  rect(
    BOX.x + selectedCell * cellWidth,
    BOX.y,
    cellWidth,
    BOX.h
  );

  // Partículas de la especie A
  noStroke();

  for (const particle of particles) {
    fill(30, 115, 225, 175);

    circle(
      particle.x,
      particle.y,
      particle.diameter
    );
  }

  drawVelocityArrow(ux);

  fill(30);
  noStroke();
  textSize(13);

  text(
    "x",
    BOX.x + BOX.w + 10,
    BOX.y + BOX.h / 2
  );

  text(
    "Partículas restantes: " +
      particles.length +
      " de " +
      INITIAL_PARTICLES,
    BOX.x,
    BOX.y + BOX.h + 23
  );

  text(
    "Tiempo: " +
      nf(simulationTime, 1, 2) +
      " s",
    BOX.x + 350,
    BOX.y + BOX.h + 23
  );

  text(
    "Concentración global relativa: " +
      nf(
        particles.length / INITIAL_PARTICLES,
        1,
        3
      ),
    BOX.x + 510,
    BOX.y + BOX.h + 23
  );

  if (particles.length === 0) {
    fill(190, 30, 30);
    textSize(20);
    textStyle(BOLD);

    text(
      "La especie A se ha consumido",
      BOX.x + BOX.w / 2 - 130,
      BOX.y + BOX.h / 2
    );

    textStyle(NORMAL);
  }
}

function drawVelocityArrow(ux) {
  const centerX = BOX.x + BOX.w / 2;
  const arrowY = BOX.y + 25;
  const arrowLength = ux * 45;

  stroke(220, 65, 45);
  strokeWeight(4);

  line(
    centerX,
    arrowY,
    centerX + arrowLength,
    arrowY
  );

  if (abs(arrowLength) > 2) {
    const direction =
      arrowLength > 0 ? 1 : -1;

    const endX =
      centerX + arrowLength;

    line(
      endX,
      arrowY,
      endX - direction * 10,
      arrowY - 7
    );

    line(
      endX,
      arrowY,
      endX - direction * 10,
      arrowY + 7
    );
  }

  noStroke();
  fill(220, 65, 45);
  textSize(13);

  text(
    "uₓ",
    centerX + arrowLength + 7,
    arrowY + 5
  );
}

function drawGraphs() {
  drawGraph(
    {
      x: 40,
      y: 390,
      w: 320,
      h: 125
    },
    "Concentración Cₐ(x)",
    concentration,
    false
  );

  drawGraph(
    {
      x: 390,
      y: 390,
      w: 320,
      h: 125
    },
    "Convección −uₓ ∂Cₐ/∂x",
    convectionTerm,
    true
  );

  drawGraph(
    {
      x: 740,
      y: 390,
      w: 320,
      h: 125
    },
    "Difusión D ∂²Cₐ/∂x²",
    diffusionTerm,
    true
  );

  drawGraph(
    {
      x: 40,
      y: 570,
      w: 320,
      h: 125
    },
    "Reacción −kCₐ",
    reactionTerm,
    true
  );

  drawGraph(
    {
      x: 390,
      y: 570,
      w: 320,
      h: 125
    },
    "Cambio total ∂Cₐ/∂t",
    totalTerm,
    true
  );

  drawParticleCountGraph({
    x: 740,
    y: 570,
    w: 320,
    h: 125
  });
}

function drawGraph(graph, title, values, centered) {
  fill(255);
  stroke(50);
  strokeWeight(1);

  rect(
    graph.x,
    graph.y,
    graph.w,
    graph.h
  );

  fill(20);
  noStroke();
  textSize(12);
  textStyle(BOLD);

  text(
    title,
    graph.x,
    graph.y - 9
  );

  textStyle(NORMAL);

  let minimumValue;
  let maximumValue;

  if (centered) {
    const maximumAbsolute = max(
      0.001,
      max(values.map(value => abs(value)))
    );

    minimumValue = -maximumAbsolute;
    maximumValue = maximumAbsolute;

    const zeroY = map(
      0,
      minimumValue,
      maximumValue,
      graph.y + graph.h,
      graph.y
    );

    stroke(185);
    line(
      graph.x,
      zeroY,
      graph.x + graph.w,
      zeroY
    );
  } else {
    minimumValue = 0;
    maximumValue = max(1, max(values));
  }

  const selectedCell = probeSlider.value();

  const selectedX = map(
    selectedCell,
    0,
    NUM_CELLS - 1,
    graph.x,
    graph.x + graph.w
  );

  stroke(230, 180, 20);
  strokeWeight(2);

  line(
    selectedX,
    graph.y,
    selectedX,
    graph.y + graph.h
  );

  stroke(35, 115, 220);
  strokeWeight(2);
  noFill();

  beginShape();

  for (let i = 0; i < values.length; i++) {
    const x = map(
      i,
      0,
      values.length - 1,
      graph.x,
      graph.x + graph.w
    );

    const y = map(
      values[i],
      minimumValue,
      maximumValue,
      graph.y + graph.h,
      graph.y
    );

    vertex(x, y);
  }

  endShape();

  fill(60);
  noStroke();
  textSize(10);

  text(
    "x",
    graph.x + graph.w - 7,
    graph.y + graph.h + 14
  );
}

function drawParticleCountGraph(graph) {
  fill(255);
  stroke(50);
  rect(graph.x, graph.y, graph.w, graph.h);

  fill(20);
  noStroke();
  textSize(12);
  textStyle(BOLD);

  text(
    "Consumo global por reacción",
    graph.x,
    graph.y - 9
  );

  textStyle(NORMAL);

  const relativeConcentration =
    particles.length / INITIAL_PARTICLES;

  const barWidth =
    relativeConcentration * (graph.w - 30);

  noStroke();
  fill(220);

  rect(
    graph.x + 15,
    graph.y + 45,
    graph.w - 30,
    30
  );

  fill(35, 115, 220);

  rect(
    graph.x + 15,
    graph.y + 45,
    barWidth,
    30
  );

  fill(20);
  textSize(13);

  text(
    "Cₐ/Cₐ₀ = " +
      nf(relativeConcentration, 1, 3),
    graph.x + 15,
    graph.y + 28
  );

  fill(70);
  textSize(11);

  text(
    "La barra disminuye cuando A reacciona.",
    graph.x + 15,
    graph.y + 100
  );
}

function drawProbePanel(ux, D, k) {
  const cell = probeSlider.value();

  const localC = concentration[cell];
  const localGradient = gradient[cell];
  const localCurvature = curvature[cell];

  const localConvection =
    convectionTerm[cell];

  const localDiffusion =
    diffusionTerm[cell];

  const localReaction =
    reactionTerm[cell];

  const localTotal =
    totalTerm[cell];

  fill(255);
  stroke(70);

  rect(
    40,
    750,
    1020,
    85,
    5
  );

  fill(20);
  noStroke();
  textSize(14);
  textStyle(BOLD);

  text(
    "Valores en la celda seleccionada",
    55,
    775
  );

  textStyle(NORMAL);
  textSize(12);

  text(
    "Cₐ = " + nf(localC, 1, 2),
    55,
    806
  );

  text(
    "−uₓ∂Cₐ/∂x = " +
      nf(localConvection, 1, 4),
    150,
    806
  );

  text(
    "D∂²Cₐ/∂x² = " +
      nf(localDiffusion, 1, 4),
    340,
    806
  );

  text(
    "−kCₐ = " +
      nf(localReaction, 1, 4),
    530,
    806
  );

  text(
    "∂Cₐ/∂t = " +
      nf(localTotal, 1, 4),
    660,
    806
  );

  text(
    "uₓ = " +
      nf(ux, 1, 1) +
      "   D = " +
      nf(D, 1, 2) +
      "   k = " +
      nf(k, 1, 3),
    830,
    806
  );
}