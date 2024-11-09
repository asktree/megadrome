// CASH CAB by iggy
// Verbal declaration:
// Creates a flashing checkerboard pattern like the Cash Cab TV show
// Unlit squares are randomly colored in a pale range and change colors each flip
// Lit squares are black
// The pattern alternates every second


let tileSize = 6; // Size of each checker tile
let lastFlipTime = 0; // Track when we last flipped the pattern
let flipState = false; // Which set of checkers is currently lit
let tileColors = []; // Store colors for unlit tiles

function setup() {
  createCanvas(43, 66);
  frameRate(30);
  colorMode(HSL, 100);
  
  // Initialize tile colors array and generate first set of colors
  let tilesX = floor(width/tileSize);
  let tilesY = floor(height/tileSize);
  generateNewColors(tilesX, tilesY);
}

// Helper function to generate new random colors for all tiles
function generateNewColors(tilesX, tilesY) {
  for (let y = 0; y < tilesY; y++) {
    tileColors[y] = [];
    for (let x = 0; x < tilesX; x++) {
      tileColors[y][x] = {
        h: random(33, 70),
        s: 80, 
        b: 80
      };
    }
  }
}

function draw() {
  background(0);
  
  // Check if we should flip the pattern (every 1 second)
  if (millis() - lastFlipTime > 1000) {
    flipState = !flipState;
    lastFlipTime = millis();
    
    // Generate new colors on each flip
    let tilesX = floor(width/tileSize);
    let tilesY = floor(height/tileSize);
    generateNewColors(tilesX, tilesY);
  }

  // Calculate number of tiles that fit
  let tilesX = floor(width/tileSize);
  let tilesY = floor(height/tileSize);
  
  // Draw the checkerboard
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      // Determine if this tile should be lit based on checkerboard pattern
      let isCheckerTile = (x + y) % 2 === 0;
      
      // Flip the pattern based on flipState
      if (flipState) isCheckerTile = !isCheckerTile;
      
      if (isCheckerTile) {
        // Lit tiles are black
        fill(0, 0, 0);
      } else {
        // Use stored colors for unlit tiles
        let color = tileColors[y][x];
        fill(color.h, color.s, color.b);
      }
      
      noStroke();
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}
