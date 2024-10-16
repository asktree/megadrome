
// HEX PULSEOS
// by emmy

let system;

let pulseos = [];
function setup() {
  createCanvas(43, 66);
  noStroke();
  colorMode(HSB, 100);
}
const GRADES = 1;

var PULSE = merlinButton(mouseClicked, "Launch Control XL:0x90:0x3b");
var PULSE2 = merlinButton(mouseClicked, "Launch Control XL:0x90:0x5b");
var PULSE_ALT = merlinButton(mouseClicked, "DDJ-FLX4:0x97:0x2");
var PULSE_ALT2 = merlinButton(mouseClicked2, "DDJ-FLX4:0x97:0x3");
var HUE_OFFSET = merlinSlider(0, 100, 0, 0.001, "Launch Control XL:0xb0:0xf"); // k3A
var HUE_RANGE = merlinSlider(
  -100,
  100,
  0,
  0.001,
  "Launch Control XL:0xb0:0x1f" // k3B
);


const MAX_D = 40;
const createPulseo = (h) => {
  return {
    d: 0,
    speed: 1,
    wiggleo: 20,
    wiggleoSpeed: 0.1,
    thickness: 7,
    h: h ?? HUE_OFFSET,
  };
};
const stepPulseo = (pulseo) => {
  pulseo.d += pulseo.speed;
};

function polygon(x, y, radius, npoints, h) {
  let angle = TWO_PI / npoints;
  beginShape();
  const progress = Math.min(radius, MAX_D) / MAX_D
  const alpha = 100 * Math.pow(1 - progress, 4) // Quartic easing out for slower fade, mostly at the end
  const hue = (500 + h+progress*HUE_RANGE) % 100
  fill(0,0,0,alpha);
  stroke(hue, 100, 100);
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
  polygon(0, 0, pulseo.d, 6, pulseo.h);
  //rotate(pulseo.d*10);

  pop();
};

function draw() {
  clear();
  pulseos.forEach((p) => stepPulseo(p));
  pulseos = pulseos.filter((p) => p.d < 50);
  pulseos.forEach((p) => drawPulseo(p));
}

function mouseClicked() {
  pulseos.push(createPulseo(HUE_OFFSET));
}

function mouseClicked2() {
  pulseos.push(createPulseo(HUE_OFFSET+4));
}
