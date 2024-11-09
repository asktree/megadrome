// by emmy
// A goopy blobby scene with metaballs! 🫧✨
// Blobs move around and merge together like a lava lamp

let system;
let blobs = [];

// Controls how many blobs are in the scene
var NUM_BLOBS = merlinSlider(1, 10, 5, 1, "Launch Control XL:0xb0:0x52");
// Controls how fast the blobs move
var BLOB_SPEED = merlinSlider(0.1, 2, 0.5, 0.01, "Launch Control XL:0xb0:0x51");

class Blob {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.r = random(5, 15);
  }
  
  move() {
    // Random walk motion
    this.vx += random(-0.1, 0.1) * BLOB_SPEED;
    this.vy += random(-0.1, 0.1) * BLOB_SPEED;
    
    // Dampen velocity
    this.vx *= 0.99;
    this.vy *= 0.99;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Wrap around edges
    this.x = (this.x + width) % width;
    this.y = (this.y + height) % height;
  }
}

function setup() {
  createCanvas(43, 66);
  noStroke();
  colorMode(HSL, 255);
  
  // Initialize blobs
  for (let i = 0; i < 10; i++) {
    blobs.push(new Blob());
  }
}

function draw() {
  background(0, 0, 255); // White background
  
  // Adjust number of blobs if needed
  while (blobs.length < NUM_BLOBS) blobs.push(new Blob());
  while (blobs.length > NUM_BLOBS) blobs.pop();
  
  // Move all blobs
  blobs.forEach(blob => blob.move());
  
  // Draw metaball field
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      
      // Sum up influence from each blob
      blobs.forEach(blob => {
        let dx = x - blob.x;
        let dy = y - blob.y;
        let d = sqrt(dx*dx + dy*dy);
        sum += blob.r / d / 100;
      });
      
      // Threshold for blob vs background
      if (sum > 1) {
        fill(0, 0, 0); // Black blob
      } else {
        fill(0, 0, 255); // White background
      }
      
      rect(x, y, 1, 1);
    }
  }
}