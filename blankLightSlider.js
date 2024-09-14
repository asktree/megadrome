// by emmy
// Let's have some fun with pulsing waves! 🌊✨
// Now with more space between waves for a calmer ocean! 🏖️😌

let system;

var BLANK_OPACITY = merlinSlider(0,1,1,0.001, "Launch Control XL:0xb0:0x52");


function setup() {
  createCanvas(43, 66);
  noStroke()
  colorMode(HSL, 255)
}

const GRADES = 11

function draw() {
  background(200, 50, 150*BLANK_OPACITY);
}