let rings;

const ringEveryDistance = 40;
const rotateEachRing = (2 * PI) / 20;

t = 0;
period = 10;
Nx = 20;
Ny = 30;
function setup() {
  createCanvas(43, 66, WEBGL);
  noSmooth();
  perspective();
  // Your setup code here
  rings = Array(30)
    .fill(0)
    .map((_, i) => makeRing(rotateEachRing * i, ringEveryDistance * i));
}

function draw() {
  // Your draw code here
  clear();
  //rotate(t*0.03)
  for (ring of rings) {
    for (x = Nx; x--; ) {
      push();
      stroke("white");
      strokeWeight(0.5);
      point(0, 0, 0);
      pop();
    }
  }
  t += 0.02;
}

function makeRing(rotation, traversal) {
  return {
    rotation,
    traversal,
  };
}
