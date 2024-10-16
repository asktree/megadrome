// by emmy

let system;

let pulseos = [];
function setup() {
  createCanvas(43, 66);
  noStroke();
  colorMode(HSL, 255);
}
const GRADES = 1;
var PULSE = merlinButton(mouseClicked, "Launch Control XL:0x90:0x5c");
var PULSE2 = merlinButton(mouseClicked, "Launch Control XL:0x90:0x3c");
var PULSE_ALT = merlinButton(mouseClicked, "DDJ-FLX4:0x97:0x6");
var PULSE_ALT2 = merlinButton(mouseClicked, "DDJ-FLX4:0x97:0x7");

const createPulseo = () => {
  return {
    d: 0,
    speed: 3,
    wiggleo: 20,
    wiggleoSpeed: 0.1,
    thickness: 7,
  };
};
const stepPulseo = (pulseo) => {
  pulseo.d += pulseo.speed;
};

// this could be optimized by simply iterating over every pulseo on every pixel and taking the max alpha and drawing that
const drawPulseo = (pulseo) => {
  for (var x = 0; x < width; x += 1) {
    for (var y = 0; y < height; y += 1) {
      const distance = pulseo.d;
      const d = Math.hypot(x - width / 2, y - height / 2);
      const n = noise(x * 0.05, y * 0.05, frameCount * pulseo.wiggleoSpeed);
      const wiggleo = pulseo.wiggleo;
      const womp = d + n * wiggleo - wiggleo / 2;
      const thicknoss = pulseo.thickness;
      const yeah = womp > distance - thicknoss && womp < distance;
      const a = 0 + (255 * (womp - (distance - thicknoss))) / thicknoss;
      if (yeah) {
        fill(0, 0, 255, a);
        rect(x, y, 1, 1);
      }
    }
  }
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
