var REVERSE = merlinSlider(0, 1, 0, 1);

let rings;

let rotateEachRing;
t = 0;
period = 10;
Nx = 20;
Ny = 20;
maxTraversal = 2000;
ringEveryDistance = maxTraversal / Ny;

function setup() {
  createCanvas(43, 66, WEBGL);
  noSmooth();
  perspective();
  // Your setup code here
  rotateEachRing = PI / 4;
  z = rotateEachRing;
  rings = Array(Ny)
    .fill(0)
    .map((_, i) => makeRing(rotateEachRing * i, ringEveryDistance * i));
}

c = 0;
function draw() {
  // Your draw code here
  clear();
  //rotate(t*0.03)
  for (ring of rings) {
    for (x = Nx; x--; ) {
      push();
      stroke("white");
      strokeWeight(0.5);
      rotate((2 * PI * x) / Nx + ring.rotation);
      point(0, 5, ring.traversal - maxTraversal / 3);
      pop();
    }
    ring.traversal += 2;
    ring.rotation += REVERSE == 1 ? 0.01 : -0.01;
  }
  if (rings[rings.length - 1].traversal > maxTraversal) {
    rings.pop();
    rings.unshift(makeRing(c * rotateEachRing, 0));
    c++;
  }
  t += 0.02;
}

function makeRing(rotation, traversal) {
  return {
    rotation,
    traversal,
  };
}
