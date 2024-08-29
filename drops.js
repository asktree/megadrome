// by Brian Smiley, with basically no changes by iggy
//Toggles parameters for Merlin Sky vs. browser editor
const MERLIN = true;
const MERLIN_ZOOM = true;
const MERLIN_PREVIEW = false;
const MAX_BRIGHTNESS = MERLIN ? 150 : 255;
let DROPS_PER_SECOND = 0.3;
const RIPPLE_DURATION = MERLIN ? 400 : 100;
//Fade modes: lines, iSq (inverse square, fade proportionally to ripple diameter)
const FADE_MODE = "linear";
const RIPPLE_SPEED = MERLIN ? 0.1 : 1;
const FADE_STEP = MAX_BRIGHTNESS / RIPPLE_DURATION;
const WACKY = false;
const TRUST = true;
//Modes: mouse, brownian, rain;
const MODE = "rain";
//Color modes: "greyscale", "rainbow" , "pastel", "rgb"
const COLORS = "greyscale";
const FR = 60;
var drops = [];
var newDropFrames = FR / DROPS_PER_SECOND;
var scl = 10;
var bX, bY;
// var dpsSlider = makeSlider(1,200,0,1);

function setup() {
  if (MERLIN) {
    if (MERLIN_ZOOM) createCanvas(475, 660);
    else createCanvas(43, 66);
  } else createCanvas(700, 700);
  frameRate(FR);
  colorMode(HSB);
  noFill();
  bX = width / 2;
  bY = height / 2;
}

function createNewDrop() {
  //Set ripple color
  let s, h;
  switch (COLORS) {
    case "greyscale":
      s = 0;
      h = 0;
      break;
    case "pastel":
      s = random(100);
      h = random(360);
      break;
    case "rgb":
      s = 100;
      h = random([hue(color("red")), hue(color("blue")), hue(color("green"))]);
      break;
    case "rainbow":
      s = 100;
      h = random(360);
      break;
    //We questionably assume that if you don't choose a color mode, COLORS is a valid color name
    default:
      s = saturation(color(COLORS));
      h = hue(color(COLORS));
      break;
  }
  //Set droplet position based on mode
  switch (MODE) {
    case "mouse":
      x = mouseX;
      y = mouseY;
      break;
    case "brownian":
      bX = max(min(bX + random(-20, 20), width), 0);
      bY = max(min(bY + random(-20, 20), height), 0);
      x = bX;
      y = bY;
      break;
    case "rain":
      //Create a new size 0 drop at a random location
      //drop array is [x, y, diameter, stroke, strokeWeight]
      x = random(MERLIN ? 43 : width);
      y = random(MERLIN ? 66 : height);
      break;
  }

  //Add a new drop with appropriate color and position

  drops.push([
    x,
    y,
    1,
    [h, s, MAX_BRIGHTNESS],
    MERLIN ? 1 : WACKY ? random(0.5, 5) : 1,
  ]);
}
function createDrops() {
  //Check that drops are correctly being removed
  //console.log(drops.length);
  //Add appropriate number of drops to the array
  //If less than one drop per frame, add on appropriate frame counts
  if (DROPS_PER_SECOND <= FR) {
    if (frameCount % newDropFrames == 0) {
      createNewDrop();
    }
  }
  //Otherwise, add appropriate number per frame plus fractional chance per frame
  else {
    // console.log('Multidrops per frame');
    let dropsPerFrame = int(1 / newDropFrames);
    let frac = (1 / newDropFrames) % 1;
    let drawFrac = random(0, 1) < frac;
    // console.log(newDropFrames,dropsPerFrame,frac,drawFrac);
    for (let i = 0; i <= dropsPerFrame; i++) {
      createNewDrop();
    }
    if (drawFrac) createNewDrop();
  }
}
function fadeDrops() {
  for (let i = 0; i < drops.length; i++) {
    drops[i][2] += RIPPLE_SPEED;
    if (FADE_MODE == "linear") drops[i][3][2] -= FADE_STEP;
    //saneLog(MAX_BRIGHTNESS / (drops[i][2]**2));
    //Square decay needs some actual mathing when I have some paper
    if (FADE_MODE == "iSq")
      drops[i][3][2] =
        MAX_BRIGHTNESS /
        (1 + drops[i][2] ** 2 / (RIPPLE_DURATION * RIPPLE_SPEED));

    //If a drop is at 0 brightness, we remove it from the array and deiterate i to correctly(?) hit the next drop
    if (drops[i][3][2] <= 0.05) {
      drops.splice(i--, 1);
      continue;
    }
  }
}
function drawDrops() {
  for (let i = 0; i < drops.length; i++) {
    //Draw the ripple
    stroke(drops[i][3][0], drops[i][3][1], drops[i][3][2]);
    strokeWeight(drops[i][4]);
    //console.log(drops[i][4]);
    circle(drops[i][0], drops[i][1], drops[i][2]);
  }
}

let ceilingShine = true;
function toBrightness(colr, brt) {
  //takes in an HSB pixel and returns it at the given brightness
  // return color(`HSB(hue(${colr}),saturation(${colr}),${brt})`)
  return [hue(colr), saturation(colr), brt];
}
function rgbToHSB(pix) {
  return color(`RGB(${pix[0]},${pix[1]},${pix[2]})`);
}
function merlinPreview() {
  if (MERLIN_PREVIEW) {
    push();
    colorMode(HSB);
    noStroke();
    fill(255);
    // line(45,0,45,height);
    rect(0, 66, 44, height);
    fill(0);
    rect(44, 0, width, height);
    rectMode(CENTER);
    noStroke();
    for (let i = 0; i < 44; i++) {
      for (let j = 0; j < 66; j++) {
        let pix = get(i, j);
        pix = rgbToHSB(pix);
        if (ceilingShine) {
          //Stroke-based ceilingshine
          fill(pix);
          stroke(toBrightness(pix, 0.35 * brightness(pix)));
          strokeWeight(3.5);
          // saneLog(i,j,pix);
          circle(50 + i * 10, 5 + j * 10, 6.5);
        } else {
          //Just draw a colored circle
          fill(pix);
          circle(50 + i * 10, 5 + j * 10, 3);
        }
      }
    }
    pop();
  }
}
function draw() {
  background(0);
  noFill();
  // if (MERLIN) DROPS_PER_SECOND = dpsSlider.value();
  createDrops();
  fadeDrops();
  drawDrops();
  merlinPreview();
}

function saneLog(message) {
  if (frameCount % 30 == 0) console.log(message);
}
