// by emmy

let system;

let pulseos = [];
function setup() {
  createCanvas(43, 66);
  noStroke();
  colorMode(HSL, 255);
}
const GRADES = 1;

var PULSE = merlinButton(mouseClicked, "Launch Control XL:0x90:0x3b");
var PULSE2 = merlinButton(mouseClicked, "Launch Control XL:0x90:0x5b");

const createPulseo = () => {
  return {
    d: 0,
    speed: 1,
    wiggleo: 20,
    wiggleoSpeed: 0.1,
    thickness: 7,
  };
};
const stepPulseo = (pulseo) => {
  pulseo.d += pulseo.speed;
};

function polygon(x, y, radius, npoints) {
  let angle = TWO_PI / npoints;
  beginShape();
  fill(0);
  stroke(255);
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// this could be optimized by simply iterating over every pulseo on every pixel and taking the max alpha and drawing that
const drawPulseo = (pulseo) => {
  push();
  translate(width * 0.5, height * 0.5);
  rotate(frameCount / 100.0);
  rotate(pulseo.d);
  polygon(0, 0, pulseo.d, 6);
  //rotate(pulseo.d*10);

  pop();
};

function draw() {
  background(0);
  pulseos.forEach((p) => stepPulseo(p));
  pulseos = pulseos.filter((p) => p.d < 50);
  pulseos.forEach((p) => drawPulseo(p));
}

function mouseClicked() {
  pulseos.push(createPulseo());
}
