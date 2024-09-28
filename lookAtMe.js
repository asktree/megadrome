// by emmy
// Let's have some fun with pulsing waves! 🌊✨
// Now with more space between waves for a calmer ocean! 🏖️😌

let system;

var WAVE_OPACITY = merlinSlider(0,1,1,0.001, "Launch Control XL:0xb0:0x51");


function setup() {
  createCanvas(43, 66);
  noStroke()
  colorMode(HSL, 255)
}

const GRADES = 11

function draw() {
  for (var x = 0; x < width; x+=1) {
    for (var y = 0; y < height; y+=1) {
      // Calculate distance from center (25, 10)
      const d = Math.hypot(x-30, y-11)/5
      
      // Add some perlin noise for organic feel
      const n = noise(x*0.05, y*0.05, frameCount/600)
      
      // Combine distance and noise, but scale down for wider waves
      const a = (d + n*5) / 8  // Changed from 4 to 8 for wider spacing
      
      // Logarithmic interpolation between 0 and 1
      // This creates the pulsing effect, now slower for more space between waves
      const underlying_value = Math.log(1 + (Math.abs((a + 0.5*(frameCount/50))) % 1)) / Math.log(2)
      
      // Adjust gradient calculation for more pronounced deadspace
      const b_gradient = WAVE_OPACITY * (1 - underlying_value*2+0.3 - d/10) * 200;  // Changed multipliers and added constants
      
      // Apply the color! Now with a touch of blue for a serene ocean feel
      fill(200, 50, b_gradient);
      rect(x, y, 10, 10);
    }   
  }
}