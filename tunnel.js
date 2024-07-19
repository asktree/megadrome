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
  colorMode(HSB, 100);
  noSmooth();
  perspective();
  // Your setup code here
  rotateEachRing = PI / 4;
  z = rotateEachRing;
  rings = Array(Ny)
    .fill(0)
    .map((_, i) => makeRing(0, ringEveryDistance * i));
}

c = 0;
function draw() {
  // Your draw code here
  clear();
  //rotate(t*0.03)
  for (ring of rings) {
    for (x = Nx; x--; ) {
      push();
      const h = (ring.count * 10) % 100;
      stroke(h, 50, 100, 100 * log(ring.traversal / 300));
      strokeWeight(0.5);
      rotate(-t * 0.3);
      translate(0, 3 * sin(t), 0);
      rotate((2 * PI * x) / Nx - t + ((ring.count % 2) * PI) / 4);
      point(0, 5, ring.traversal - 600);
      pop();
    }

    ring.traversal += 2;
    ring.rotation += REVERSE == 1 ? 0.01 : -0.01;
  }
  if (rings[rings.length - 1].traversal > maxTraversal) {
    rings.pop();
    rings.unshift(makeRing(0, 0));
  }
  noStroke();
  fill("black");
  //circle(0,0,7)
  t += 0.02;
}

function makeRing(rotation, traversal) {
  c++;
  return {
    rotation,
    traversal,
    count: c,
  };
}
