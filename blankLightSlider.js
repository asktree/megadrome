// by emmy
// Let's have some fun with pulsing waves! 🌊✨
// Now with more space between waves for a calmer ocean! 🏖️😌

let system;

var BLANK_OPACITY = merlinSlider(0,1,1,0.001, "Launch Control XL:0xb0:0x52");
var HUE_OFFSET = merlinSlider(0, 255, 0, 0.001, "Launch Control XL:0xb0:0x13"); // k3A



function setup() {
  createCanvas(43, 66);
  noStroke()
  colorMode(HSL, 255)
}


function draw() {
  background((255*2 + 200 + HUE_OFFSET) % 255, 50, 150*BLANK_OPACITY);
}