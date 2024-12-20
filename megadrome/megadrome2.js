// sex
// by emmy + cam 2024

let noise;
// the canvas variable is needed for the capturer
let canvas;

const HISTORY_BUFFER_SECONDS = 3;
const NUM_FFT_BINS = 2 ** 9;

// the basic way things work is:
// each PIXEL (at time t) gets mapped to a CUM (aka a frequency)
// each CUM has a static mapping to an octave
// each octave maps to a HUE, and BRIGHTNESS based on its energy level
let pixelToCum;
let cumToOctave;
let getEnergies;
let getRawEnergies;
let cumUniformizer;
var HUE_OFFSET = merlinSlider(0, 100, 0, 0.001, "Launch Control XL:0xb0:0xf"); // k3A
var SATURATION_LOW_FREQ = merlinSlider(
  0,
  100,
  100,
  0.001,
  "Launch Control XL:0xb0:0x13"
); // k3A
var SATURATION_HIGH_FREQ = merlinSlider(
  0,
  100,
  100,
  0.001,
  "Launch Control XL:0xb0:0x14"
); // k3A

var HUE_OFFSET2 = 0; //merlinSlider(-50, 50, 0, 0.001, "DDJ-FLX4:0xb0:0x20");
var HUE_RANGE = merlinSlider(
  -100,
  100,
  0,
  0.001,
  "Launch Control XL:0xb0:0x1f" // k3B
);

var NOISE2_SCALAR = merlinSlider(
  0,
  20,
  5,
  0.001,
  "Launch Control XL:0xb0:0x11"
);
var NOISE2_POS_SCALAR = merlinSlider(
  0,
  0.1,
  0.01,
  0.001,
  "Launch Control XL:0xb0:0x12"
);
var NOISE2_X_MOTION = merlinSlider(
  -1,
  1,
  0,
  0.001,
  "Impact LX25+ MIDI2:0xbf:0x39"
);
var NOISE2_Y_MOTION = merlinSlider(
  -1,
  1,
  0,
  0.001,
  "Impact LX25+ MIDI2:0xbf:0x3c"
);

var D2_SCALAR = merlinSlider(0, 0.2, 0.1, 0.001, "Launch Control XL:0xb0:0x21");
var D2_MOTION = merlinSlider(
  -1.5,
  1.5,
  0,
  0.001,
  "Launch Control XL:0xb0:0x22"
);

var D_OFFSET = merlinSlider(0, 10, 0, 0.1, "Launch Control XL:0xb0:0x31");
var D2_OFFSET = merlinSlider(0, 2, 0, 0.1, "Launch Control XL:0xb0:0x35");

var R_OFFSET = merlinSlider(0, 10, 0, 0.1, "Launch Control XL:0xb0:0x32");
var ORIGIN_X = merlinSlider(-100, 100, 21.5, 0.1);
var ORIGIN_Y = merlinSlider(0, 66, 33, 0.1, "Impact LX25+ MIDI1:0xe0:0x0");
var D_SCALAR = merlinSlider(0, 0.5, 0.1, 0.001, "Launch Control XL:0xb0:0xd");
var D_MOTION = merlinSlider(-1.5, 1.5, 0, 0.001, "Launch Control XL:0xb0:0x1d");
var ROTATION_SCALAR = merlinSlider(
  0,
  0.25,
  0,
  0.001,
  "Launch Control XL:0xb0:0xe"
);
var ROTATION_MOTION = merlinSlider(
  -0.05,
  0.05,
  0,
  0.01,
  "Launch Control XL:0xb0:0x1e"
);
var PULSE_OCTAVE = merlinSlider(0, 30, 2, 1);
var PULSE_SIZE = merlinSlider(0, 4, 0, 0.001, "Launch Control XL:0xb0:0x34");
var PULSE2_SIZE = merlinSlider(0, 2.5, 0, 0.001, "Launch Control XL:0xb0:0x36");

/** used by proportional octave mapping,
 * sets the energy level of a fake octave that is always black.
 * without this, all pixels would be lit up at all times. */
var PROPORTION_DEADZONE = merlinSlider(
  0,
  25,
  0,
  0.01,
  "Launch Control XL:0xb0:0x10"
);
/** used by proportional octave mapping,
 * gain on each octave, used only for proportion, not brightness */
var PROPORTION_GAIN = merlinSlider(
  -0.6,
  0.6,
  0,
  0.01,
  "Launch Control XL:0xb0:0x20"
);
var GLOBAL_ROTATION = merlinSlider(
  -0.1,
  0.1,
  0,
  0.0001,
  "Launch Control XL:0xb0:0x1e"
);
var GLOBAL_MOTION_SCALAR = merlinSlider(
  -1,
  3,
  1,
  0.001,
  "Launch Control XL:0xb0:0x33"
);
//var SCALE_CURVE = merlinCurve("identity");

var ROLLING_FRAME_COUNT = 1;
var SMOOTHING_COEFF = merlinSlider(
  0.0,
  0.99,
  0.5,
  0.001,
  "Launch Control XL:0xb0:0x4d"
);
var NUM_OCTAVE_BINS = merlinSlider(2, 30, 10, 1, "Launch Control XL:0xb0:0x4f");

var RESET_FFT = merlinButton(flushNormalizer, "Launch Control XL:0x90:0x49");

function invert() {
  invertColor = !invertColor;
  setTimeout(() => {
    invertColor = !invertColor;
  }, 100);
}
var INVERTO = merlinButton(invert, "Launch Control XL:0x90:0x4c");
var INVERTO2 = merlinButton(invert, "Launch Control XL:0x90:0x4b");
var INVERTO3 = merlinButton(invert, "DDJ-FLX4:0x97:0x0");
var INVERTO4 = merlinButton(invert, "DDJ-FLX4:0x97:0x1");

var GLOBO_OPACITO = merlinSlider(
  0,
  150,
  100,
  0.01,
  "Launch Control XL:0xb0:0x50"
);

let invertColor = false;

let noise2XOffset = 0;
let noise2YOffset = 0;
let dOffset = 0;
let d2Offset = 0;
let rotationOffset = 0;
let globalRotationOffset = 0;

var SHOW_SPECTROGRAPH_B = merlinButton(
  toggleSpectrograph,
  "Launch Control XL:0x80:0x59"
);

let fft;
var SHOW_SPECTROGRAPH = merlinSlider(0, 1, 0, 1, "Launch Control XL:0xb0:0x4e");

//var SHOW_SPECTROGRAPH = false;
function toggleSpectrograph() {
  SHOW_SPECTROGRAPH = !SHOW_SPECTROGRAPH;
}

function setup() {
  canvas = createCanvas(43, 66).canvas;
  colorMode(HSB, 100);

  noise = new OpenSimplexNoise(Date.now());

  // OPTIONS
  const simplexMap1 = createSimplex3DMap(
    globo_rotato(x2_pos),
    globo_rotato(y2_pos),
    pulse_dist_pos_2
  );
  const pixelToNoise = createSimplexMap(
    globo_rotato(x_pos),
    pulse_dist_pos,
    globo_rotato(y_pos),
    (x, y) => simplexMap1(x, y) * NOISE2_SCALAR
  );

  [pixelToCum, cumUniformizer] = createUniformizedMap(pixelToNoise, () => [
    Math.random() * 100,
    Math.random() * 100,
    Math.random() * 1000,
    Math.random() * 1000,
  ]);

  // OPTIONS:
  // * createEnergyGetter()
  // * createAudioNormalizer(createEnergyGetter());
  getRawEnergies = createEnergyGetter();
  getEnergies = createAudioNormalizer(createEnergyGetter());

  // OPTIONS:
  // * uniformCumOctaveMap -- each octave gets equal # of pixels
  // * proportionalCumOctaveMap() -- each octave gets # of pixels proportional to volume
  //   minimum (poorly named) sets a base volume for each frequency
  //
  cumToOctave = proportionalCumOctaveMap();
}

function draw() {
  render();
  upsnarf();
}

// update wuz taken
function upsnarf() {
  noise2XOffset -= NOISE2_X_MOTION * NOISE2_POS_SCALAR * GLOBAL_MOTION_SCALAR;
  noise2YOffset -= NOISE2_Y_MOTION * NOISE2_POS_SCALAR * GLOBAL_MOTION_SCALAR;
  dOffset -= D_MOTION * D_SCALAR * GLOBAL_MOTION_SCALAR * GLOBAL_MOTION_SCALAR;
  d2Offset -= D2_MOTION * D2_SCALAR * GLOBAL_MOTION_SCALAR;
  rotationOffset += ROTATION_MOTION * ROTATION_SCALAR * GLOBAL_MOTION_SCALAR;
  globalRotationOffset += GLOBAL_ROTATION * GLOBAL_MOTION_SCALAR;
}

let energyCacheHack = undefined;

var lastSmoothing = 0;
function render() {
  const normalizedSmoothedEnergies = getEnergies();
  const rawEnergies = getRawEnergies();
  const energies = rawEnergies.map((x, i) => {
    return x * normalizedSmoothedEnergies[i];
  });
  energyCacheHack = energies;
  push();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let cum = pixelToCum(x, y);
      let octave = cumToOctave(cum, energies);
      let energy = energies[octave] ?? 0;
      let hue = octaveHueMap((octave + 1) / energies.length);
      let saturation = octaveSaturationMap((octave + 1) / energies.length);
      //if (isNaN(energy)) { console.log("REEEE")}
      let brightness = energy * GLOBO_OPACITO; //SCALE_CURVE(energy || 0) * 100;
      const color = [hue, saturation, brightness];

      noStroke();
      fill(...color);
      rect(x, y, 10, 10);
    }
  }
  pop();
  if (SHOW_SPECTROGRAPH > 0) drawSpectrograph(energies, rawEnergies);

  if (SMOOTHING_COEFF != lastSmoothing) {
    fft.smooth(SMOOTHING_COEFF);
    lastSmoothing = SMOOTHING_COEFF;
  }
}

// AUDIO UTILS
// ----------------

function createEnergyGetter() {
  // Gets a reference to computer's microphone
  // https://p5js.org/reference/#/p5.AudioIn
  const mic = new p5.AudioIn();
  // Start processing audio input
  // https://p5js.org/reference/#/p5.AudioIn/start
  mic.start();
  // used to be 256. why?
  fft = new p5.FFT(SMOOTHING_COEFF, NUM_FFT_BINS);
  fft.setInput(mic);

  return () => {
    const spectrum = fft.analyze();
    // const bands = fft.getOctaveBands(1);
    // const bandEnergies = fixedLogAverages(fft, bands);
    const bandEnergies = splitOctaves(spectrum, NUM_OCTAVE_BINS);

    return bandEnergies.map((x) => x / 255); //can do slice(0, -2) to cut last 2 octaves
  };
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function createAudioSmoother(getEnergies) {
  let historicalEnergies = [];
  return () => {
    const newNormalizedAudio = [...getEnergies()];
    historicalEnergies.unshift(newNormalizedAudio);
    while (historicalEnergies.length > ROLLING_FRAME_COUNT) {
      historicalEnergies.pop();
    }
    const smoothedEnergies = newNormalizedAudio.map((e, i) => {
      const historyOfEnergy = historicalEnergies.map((energies) => energies[i]);
      return average(historyOfEnergy);
    });
    return smoothedEnergies;
  };
}

let historicalEnergies = [];

function flushNormalizer() {
  historicalEnergies = [];
}
function createAudioNormalizer(getEnergies) {
  // array of energies over time
  return () => {
    const uneditedEnergies = getEnergies();
    const historyLength = HISTORY_BUFFER_SECONDS * 60;

    // fft a few moments to kick in and not just spit out zeros
    // and we dont want to pollute history with that
    if (uneditedEnergies[0] === 0) return uneditedEnergies;

    // push audio data from current frame into historical data
    // trim historical data if needed to be specified length (e.g. X frames of history)
    // emmy left this mutative for the sake of optimization
    historicalEnergies.unshift(uneditedEnergies);
    while (historicalEnergies.length > historyLength) {
      historicalEnergies.pop();
    }

    const normalizedEnergies = uneditedEnergies.map((e, i) => {
      const historyOfEnergy = historicalEnergies.map((energies) => energies[i]);
      const highestLevel = Math.max(...historyOfEnergy);
      const lowestLevel = Math.min(...historyOfEnergy);
      if (highestLevel === 0) return 0;
      return map(e, lowestLevel, highestLevel, 0, 1);
    });

    return normalizedEnergies;
  };
}

function createAudioSmoother(getEnergies) {
  let historicalEnergies = [];
  return () => {
    const newNormalizedAudio = [...getEnergies()];
    historicalEnergies.unshift(newNormalizedAudio);
    while (historicalEnergies.length > ROLLING_FRAME_COUNT) {
      historicalEnergies.pop();
    }
    const smoothedEnergies = newNormalizedAudio.map((e, i) => {
      const historyOfEnergy = historicalEnergies.map((energies) => energies[i]);
      return average(historyOfEnergy);
    });
    return smoothedEnergies;
  };
}

function createAudioNormalizer(getEnergies) {
  // array of energies over time
  let historicalEnergies = [];
  return () => {
    const uneditedEnergies = getEnergies();
    const historyLength = HISTORY_BUFFER_SECONDS * 60;

    // fft a few moments to kick in and not just spit out zeros
    // and we dont want to pollute history with that
    if (uneditedEnergies[0] === 0) return uneditedEnergies;

    // push audio data from current frame into historical data
    // trim historical data if needed to be specified length (e.g. X frames of history)
    // emmy left this mutative for the sake of optimization
    historicalEnergies.unshift(uneditedEnergies);
    while (historicalEnergies.length > historyLength) {
      historicalEnergies.pop();
    }

    const normalizedEnergies = uneditedEnergies.map((e, i) => {
      const historyOfEnergy = historicalEnergies.map((energies) => energies[i]);
      const highestLevel = Math.max(...historyOfEnergy);
      const lowestLevel = Math.min(...historyOfEnergy);
      if (highestLevel === 0) return 0;
      return map(e, lowestLevel, highestLevel, 0, 1);
    });

    return normalizedEnergies;
  };
}

function splitOctaves(spectrum, slicesPerOctave) {
  var scaledSpectrum = [];
  var len = spectrum.length;

  // default to thirds
  var n = slicesPerOctave || 3;
  var nthRootOfTwo = Math.pow(2, 1 / n);

  // the last N bins get their own
  var lowestBin = slicesPerOctave;

  var binIndex = len - 1;
  var i = binIndex;

  while (i > lowestBin) {
    var nextBinIndex = round(binIndex / nthRootOfTwo);

    if (nextBinIndex === 1) return;

    var total = 1;
    var numBins = 0;

    // add up all of the values for the frequencies
    for (i = binIndex; i > nextBinIndex; i--) {
      // total += spectrum[i];
      total *= spectrum[i];
      numBins++;
    }

    // divide total sum by number of bins
    //var energy = total/numBins;
    var energy = Math.pow(total, 1 / numBins);
    scaledSpectrum.push(energy);

    // keep the loop going
    binIndex = nextBinIndex;
  }

  // add the lowest bins at the end
  for (var j = i; j > 0; j--) {
    scaledSpectrum.push(spectrum[j]);
  }

  // reverse so that array has same order as original array (low to high frequencies)
  scaledSpectrum.reverse();

  return scaledSpectrum;
}
/* 
function fixedLogAverages(fft, octaveBands) {
  var audiocontext = getAudioContext();
  var nyquist = audiocontext.sampleRate / 2;
  var spectrum = fft.freqDomain;
  var spectrumLength = spectrum.length;
  var logAverages = new Array(octaveBands.length);
  var octaveIndex = 0;
  for (var specIndex = 0; specIndex < spectrumLength; specIndex++) {
    var specIndexFrequency = Math.round(
      (specIndex * nyquist) / fft.freqDomain.length
    );

    if (specIndexFrequency > octaveBands[octaveIndex].hi) {
      octaveIndex++;
    }

    logAverages[octaveIndex] =
      logAverages[octaveIndex] !== undefined
        ? logAverages[octaveIndex] + spectrum[specIndex]
        : spectrum[specIndex];
  }

  return logAverages.map((x, i) => x);
}
 */
// CUM [0, 1] -> ENERGY [0, 1]
// ----------------
/** this function creates a shitty mock audio input */
function getEnergyMock(cum) {
  return noise.noise2D(cum * 2, frameCount / 50);
}

function uniformCumOctaveMap(cum, energies) {
  if (cum < 0 || cum > 1) throw new Error(`cum out of bounds: ${cum}`);
  const index =
    cum === 1 ? energies.length - 1 : Math.floor(cum * energies.length);

  return index;
}

// This makes the distribution of octaves based on the relative volumes of each octave
const proportionalCumOctaveMap = () => (cum, energies) => {
  // add a null octave with a fixed energy level to create dark area
  const energiesWithDeadzone = [...energies, PROPORTION_DEADZONE];
  const energySum = energiesWithDeadzone.reduce(
    (partialSum, e) => partialSum + Math.max(e + PROPORTION_GAIN, 0),
    0
  );
  const proportions = energiesWithDeadzone.map(
    (e) => Math.max(e + PROPORTION_GAIN, 0) / energySum
  );
  const uniformizedCum = cumUniformizer(cum);

  // we are gonna keep checking each octave until uniformizedCum < the running sum of proportions
  // that way the probability of landing on an octave = its proportion. cool!
  let octave = 0;
  let accumulator = 0;
  for (let index = 0; index < energiesWithDeadzone.length; index++) {
    accumulator += proportions[index];
    octave = index;
    if (cum < accumulator) break;
  }

  return octave;
};

// CUM [0, 1] -> HUE
const octaveHueMap = (cum) =>
  (500 + HUE_OFFSET + cum * HUE_RANGE + (invertColor ? 50 : 0)) % 100;

const octaveSaturationMap = (x) =>
  SATURATION_LOW_FREQ + (SATURATION_HIGH_FREQ - SATURATION_LOW_FREQ) * x;

// PIXEL (x, y) -> CUM [0, 1]
// ----------------
function createSimplex3DMap(f, g, h) {
  const noise = new OpenSimplexNoise(Date.now());
  return (...args) => noise.noise3D(f(...args), g(...args), h(...args));
}
function createSimplexMap(f, g, h, i) {
  const noise = new OpenSimplexNoise(Date.now());
  return (...args) =>
    noise.noise4D(f(...args), g(...args), h(...args), i(...args));
}

const getPulseSize = () => {
  try {
    return energyCacheHack
      ? (energyCacheHack[2] * 0.6 +
          energyCacheHack[3] * 0.4 +
          energyCacheHack[1] * 0.4 +
          energyCacheHack[0] * 0.1 +
          energyCacheHack[4] * 0.1) *
          PULSE_SIZE *
          GLOBAL_MOTION_SCALAR
      : 0;
  } catch {
    return 0;
  }
};

// PIXEL (x, y) -> NOISE POS
// ----------------
const x2_pos = (x, y) => (x - ORIGIN_X) * NOISE2_POS_SCALAR + noise2XOffset;
const y2_pos = (x, y) => (y - ORIGIN_Y) * NOISE2_POS_SCALAR + noise2YOffset;
const x_pos = (x, y) => (x - ORIGIN_X) * ROTATION_SCALAR;
const y_pos = (x, y) => (y - ORIGIN_Y) * ROTATION_SCALAR;

const t_pos = (x, y) => frameCount / 60;
const dist_pos = (x, y) =>
  Math.hypot(x - ORIGIN_X, y - ORIGIN_Y) * D_SCALAR +
  dOffset -
  D_OFFSET -
  (invertColor ? 0.4 : 0);
const dist_pos_2 = (x, y) =>
  Math.hypot(x - ORIGIN_X, y - ORIGIN_Y) * D2_SCALAR + d2Offset - D2_OFFSET;
const pulse_dist_pos = (x, y) => dist_pos(x, y) - getPulseSize();
const pulse_dist_pos_2 = (x, y) => dist_pos_2(x, y) - getPulseSize();

function calculateAngle(x1, y1, x2, y2) {
  // Calculate the angle in radians
  const angleRadians = Math.atan2(y2 - y1, x2 - x1);

  return angleRadians;
}
const rotation_pos = (x, y) =>
  calculateAngle(ORIGIN_X, ORIGIN_Y, x, y) + rotationOffset + R_OFFSET;
/*  calculateAngle(ORIGIN_X, ORIGIN_Y, x, y) * ROTATION_SCALAR +
  rotationOffset +
  R_OFFSET; */

const sin_pos = (...args) => Math.sin(rotation_pos(...args)) * ROTATION_SCALAR;
const cos_pos = (...args) => Math.cos(rotation_pos(...args)) * ROTATION_SCALAR;
const zero_pos = (...args) => 0;

const globo_rotato = (f) => (x, y) => {
  const angle = globalRotationOffset + R_OFFSET;
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  const newX = (x - ORIGIN_X) * c - (y - ORIGIN_Y) * s + ORIGIN_X;
  const newY = (x - ORIGIN_X) * s + (y - ORIGIN_Y) * c + ORIGIN_Y;
  return f(newX, newY);
};

// UTILS
// ----------------
/** take a function f, sample it a bunch, and make a fn that takes outputs of f and returns a value 0 to 1 with a uniform distribution. */
// note that it should be possible to do this analytically, but like, its hard
function createUniformizer(f, mockInput, samples = 1000) {
  const buckets = [];
  for (var n = 0; n < samples; n += 1) {
    buckets.push(f(...mockInput()));
  }
  // ascending sort
  buckets.sort((a, b) => (a < b ? -1 : 1));
  const uniformizer = (x) => {
    // find the first sample greater than x
    const index = buckets.findIndex((u) => u > x);
    // if not found, that means x is > than any sample, so we should just provide the min value.
    return index >= 0 ? (index + 1) / buckets.length : 1;
  };

  return uniformizer;
}

function createUniformizedMap(f, mockInput, samples = 1000) {
  const uniformizer = createUniformizer(f, mockInput, samples);
  return [(...args) => uniformizer(f(...args)), uniformizer];
}

function drawSpectrograph(energies, rawEnergies) {
  //const rectWidth = Math.round(height / energies.length / 2);
  const rectWidth = 3;
  const spectrographHeight = 20;
  push();
  translate(0, height);
  scale(1, -1);
  // Draw black outline box
  rawEnergies.forEach((energy, i) => {
    fill(0, 0, 0);
    rect(
      0,
      height - rectWidth * (i + 1),
      spectrographHeight * energy + 4,
      rectWidth + 1
    );
  });
  // Draw colored bar for display energy
  energies.forEach((energy, i) => {
    noStroke();
    fill(octaveHueMap((i + 1) / energies.length), 100, 50);
    rect(
      0,
      height + 1 - rectWidth * (i + 1),
      spectrographHeight * energy + 2,
      rectWidth - 1
    );
  });
  // Draw raw energy white bar
  rawEnergies.forEach((energy, i) => {
    noStroke();
    fill(0, 0, 70);
    rect(
      spectrographHeight * energy + 2,
      height + 1 - rectWidth * (i + 1),
      1,
      rectWidth - 1
    );
  });
  // Draw peak indicators -- a white bar at the bottom
  rawEnergies.forEach((energy, i) => {
    if (energy > 0.99) {
      noStroke();
      fill(0, 0, 70);
      rect(0, height + 1 - rectWidth * (i + 1), 3, rectWidth - 1);
    }
  });
  pop();
}

// LIB
// ----------------
// Plain JS version of Josh Forisha's implementation of opensimplex noise
// https://github.com/joshforisha/open-simplex-noise-js
// This version is currently posted here https://gist.github.com/PARC6502/85c99c04c9b3c6ae52c3c27605b4df0a
var OpenSimplexNoise;
(function () {
  var constants_1 = {
    NORM_2D: 1.0 / 47.0,
    NORM_3D: 1.0 / 103.0,
    NORM_4D: 1.0 / 30.0,
    SQUISH_2D: (Math.sqrt(2 + 1) - 1) / 2,
    SQUISH_3D: (Math.sqrt(3 + 1) - 1) / 3,
    SQUISH_4D: (Math.sqrt(4 + 1) - 1) / 4,
    STRETCH_2D: (1 / Math.sqrt(2 + 1) - 1) / 2,
    STRETCH_3D: (1 / Math.sqrt(3 + 1) - 1) / 3,
    STRETCH_4D: (1 / Math.sqrt(4 + 1) - 1) / 4,
    base2D: [
      [1, 1, 0, 1, 0, 1, 0, 0, 0],
      [1, 1, 0, 1, 0, 1, 2, 1, 1],
    ],
    base3D: [
      [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1],
      [2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1, 3, 1, 1, 1],
      [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1],
    ],
    base4D: [
      [
        0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0,
        1,
      ],
      [
        3, 1, 1, 1, 0, 3, 1, 1, 0, 1, 3, 1, 0, 1, 1, 3, 0, 1, 1, 1, 4, 1, 1, 1,
        1,
      ],
      [
        1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 2, 1, 1, 0,
        0, 2, 1, 0, 1, 0, 2, 1, 0, 0, 1, 2, 0, 1, 1, 0, 2, 0, 1, 0, 1, 2, 0, 0,
        1, 1,
      ],
      [
        3, 1, 1, 1, 0, 3, 1, 1, 0, 1, 3, 1, 0, 1, 1, 3, 0, 1, 1, 1, 2, 1, 1, 0,
        0, 2, 1, 0, 1, 0, 2, 1, 0, 0, 1, 2, 0, 1, 1, 0, 2, 0, 1, 0, 1, 2, 0, 0,
        1, 1,
      ],
    ],
    gradients2D: [5, 2, 2, 5, -5, 2, -2, 5, 5, -2, 2, -5, -5, -2, -2, -5],
    gradients3D: [
      -11, 4, 4, -4, 11, 4, -4, 4, 11, 11, 4, 4, 4, 11, 4, 4, 4, 11, -11, -4, 4,
      -4, -11, 4, -4, -4, 11, 11, -4, 4, 4, -11, 4, 4, -4, 11, -11, 4, -4, -4,
      11, -4, -4, 4, -11, 11, 4, -4, 4, 11, -4, 4, 4, -11, -11, -4, -4, -4, -11,
      -4, -4, -4, -11, 11, -4, -4, 4, -11, -4, 4, -4, -11,
    ],
    gradients4D: [
      3, 1, 1, 1, 1, 3, 1, 1, 1, 1, 3, 1, 1, 1, 1, 3, -3, 1, 1, 1, -1, 3, 1, 1,
      -1, 1, 3, 1, -1, 1, 1, 3, 3, -1, 1, 1, 1, -3, 1, 1, 1, -1, 3, 1, 1, -1, 1,
      3, -3, -1, 1, 1, -1, -3, 1, 1, -1, -1, 3, 1, -1, -1, 1, 3, 3, 1, -1, 1, 1,
      3, -1, 1, 1, 1, -3, 1, 1, 1, -1, 3, -3, 1, -1, 1, -1, 3, -1, 1, -1, 1, -3,
      1, -1, 1, -1, 3, 3, -1, -1, 1, 1, -3, -1, 1, 1, -1, -3, 1, 1, -1, -1, 3,
      -3, -1, -1, 1, -1, -3, -1, 1, -1, -1, -3, 1, -1, -1, -1, 3, 3, 1, 1, -1,
      1, 3, 1, -1, 1, 1, 3, -1, 1, 1, 1, -3, -3, 1, 1, -1, -1, 3, 1, -1, -1, 1,
      3, -1, -1, 1, 1, -3, 3, -1, 1, -1, 1, -3, 1, -1, 1, -1, 3, -1, 1, -1, 1,
      -3, -3, -1, 1, -1, -1, -3, 1, -1, -1, -1, 3, -1, -1, -1, 1, -3, 3, 1, -1,
      -1, 1, 3, -1, -1, 1, 1, -3, -1, 1, 1, -1, -3, -3, 1, -1, -1, -1, 3, -1,
      -1, -1, 1, -3, -1, -1, 1, -1, -3, 3, -1, -1, -1, 1, -3, -1, -1, 1, -1, -3,
      -1, 1, -1, -1, -3, -3, -1, -1, -1, -1, -3, -1, -1, -1, -1, -3, -1, -1, -1,
      -1, -3,
    ],
    lookupPairs2D: [
      0, 1, 1, 0, 4, 1, 17, 0, 20, 2, 21, 2, 22, 5, 23, 5, 26, 4, 39, 3, 42, 4,
      43, 3,
    ],
    lookupPairs3D: [
      0, 2, 1, 1, 2, 2, 5, 1, 6, 0, 7, 0, 32, 2, 34, 2, 129, 1, 133, 1, 160, 5,
      161, 5, 518, 0, 519, 0, 546, 4, 550, 4, 645, 3, 647, 3, 672, 5, 673, 5,
      674, 4, 677, 3, 678, 4, 679, 3, 680, 13, 681, 13, 682, 12, 685, 14, 686,
      12, 687, 14, 712, 20, 714, 18, 809, 21, 813, 23, 840, 20, 841, 21, 1198,
      19, 1199, 22, 1226, 18, 1230, 19, 1325, 23, 1327, 22, 1352, 15, 1353, 17,
      1354, 15, 1357, 17, 1358, 16, 1359, 16, 1360, 11, 1361, 10, 1362, 11,
      1365, 10, 1366, 9, 1367, 9, 1392, 11, 1394, 11, 1489, 10, 1493, 10, 1520,
      8, 1521, 8, 1878, 9, 1879, 9, 1906, 7, 1910, 7, 2005, 6, 2007, 6, 2032, 8,
      2033, 8, 2034, 7, 2037, 6, 2038, 7, 2039, 6,
    ],
    lookupPairs4D: [
      0, 3, 1, 2, 2, 3, 5, 2, 6, 1, 7, 1, 8, 3, 9, 2, 10, 3, 13, 2, 16, 3, 18,
      3, 22, 1, 23, 1, 24, 3, 26, 3, 33, 2, 37, 2, 38, 1, 39, 1, 41, 2, 45, 2,
      54, 1, 55, 1, 56, 0, 57, 0, 58, 0, 59, 0, 60, 0, 61, 0, 62, 0, 63, 0, 256,
      3, 258, 3, 264, 3, 266, 3, 272, 3, 274, 3, 280, 3, 282, 3, 2049, 2, 2053,
      2, 2057, 2, 2061, 2, 2081, 2, 2085, 2, 2089, 2, 2093, 2, 2304, 9, 2305, 9,
      2312, 9, 2313, 9, 16390, 1, 16391, 1, 16406, 1, 16407, 1, 16422, 1, 16423,
      1, 16438, 1, 16439, 1, 16642, 8, 16646, 8, 16658, 8, 16662, 8, 18437, 6,
      18439, 6, 18469, 6, 18471, 6, 18688, 9, 18689, 9, 18690, 8, 18693, 6,
      18694, 8, 18695, 6, 18696, 9, 18697, 9, 18706, 8, 18710, 8, 18725, 6,
      18727, 6, 131128, 0, 131129, 0, 131130, 0, 131131, 0, 131132, 0, 131133,
      0, 131134, 0, 131135, 0, 131352, 7, 131354, 7, 131384, 7, 131386, 7,
      133161, 5, 133165, 5, 133177, 5, 133181, 5, 133376, 9, 133377, 9, 133384,
      9, 133385, 9, 133400, 7, 133402, 7, 133417, 5, 133421, 5, 133432, 7,
      133433, 5, 133434, 7, 133437, 5, 147510, 4, 147511, 4, 147518, 4, 147519,
      4, 147714, 8, 147718, 8, 147730, 8, 147734, 8, 147736, 7, 147738, 7,
      147766, 4, 147767, 4, 147768, 7, 147770, 7, 147774, 4, 147775, 4, 149509,
      6, 149511, 6, 149541, 6, 149543, 6, 149545, 5, 149549, 5, 149558, 4,
      149559, 4, 149561, 5, 149565, 5, 149566, 4, 149567, 4, 149760, 9, 149761,
      9, 149762, 8, 149765, 6, 149766, 8, 149767, 6, 149768, 9, 149769, 9,
      149778, 8, 149782, 8, 149784, 7, 149786, 7, 149797, 6, 149799, 6, 149801,
      5, 149805, 5, 149814, 4, 149815, 4, 149816, 7, 149817, 5, 149818, 7,
      149821, 5, 149822, 4, 149823, 4, 149824, 37, 149825, 37, 149826, 36,
      149829, 34, 149830, 36, 149831, 34, 149832, 37, 149833, 37, 149842, 36,
      149846, 36, 149848, 35, 149850, 35, 149861, 34, 149863, 34, 149865, 33,
      149869, 33, 149878, 32, 149879, 32, 149880, 35, 149881, 33, 149882, 35,
      149885, 33, 149886, 32, 149887, 32, 150080, 49, 150082, 48, 150088, 49,
      150098, 48, 150104, 47, 150106, 47, 151873, 46, 151877, 45, 151881, 46,
      151909, 45, 151913, 44, 151917, 44, 152128, 49, 152129, 46, 152136, 49,
      152137, 46, 166214, 43, 166215, 42, 166230, 43, 166247, 42, 166262, 41,
      166263, 41, 166466, 48, 166470, 43, 166482, 48, 166486, 43, 168261, 45,
      168263, 42, 168293, 45, 168295, 42, 168512, 31, 168513, 28, 168514, 31,
      168517, 28, 168518, 25, 168519, 25, 280952, 40, 280953, 39, 280954, 40,
      280957, 39, 280958, 38, 280959, 38, 281176, 47, 281178, 47, 281208, 40,
      281210, 40, 282985, 44, 282989, 44, 283001, 39, 283005, 39, 283208, 30,
      283209, 27, 283224, 30, 283241, 27, 283256, 22, 283257, 22, 297334, 41,
      297335, 41, 297342, 38, 297343, 38, 297554, 29, 297558, 24, 297562, 29,
      297590, 24, 297594, 21, 297598, 21, 299365, 26, 299367, 23, 299373, 26,
      299383, 23, 299389, 20, 299391, 20, 299584, 31, 299585, 28, 299586, 31,
      299589, 28, 299590, 25, 299591, 25, 299592, 30, 299593, 27, 299602, 29,
      299606, 24, 299608, 30, 299610, 29, 299621, 26, 299623, 23, 299625, 27,
      299629, 26, 299638, 24, 299639, 23, 299640, 22, 299641, 22, 299642, 21,
      299645, 20, 299646, 21, 299647, 20, 299648, 61, 299649, 60, 299650, 61,
      299653, 60, 299654, 59, 299655, 59, 299656, 58, 299657, 57, 299666, 55,
      299670, 54, 299672, 58, 299674, 55, 299685, 52, 299687, 51, 299689, 57,
      299693, 52, 299702, 54, 299703, 51, 299704, 56, 299705, 56, 299706, 53,
      299709, 50, 299710, 53, 299711, 50, 299904, 61, 299906, 61, 299912, 58,
      299922, 55, 299928, 58, 299930, 55, 301697, 60, 301701, 60, 301705, 57,
      301733, 52, 301737, 57, 301741, 52, 301952, 79, 301953, 79, 301960, 76,
      301961, 76, 316038, 59, 316039, 59, 316054, 54, 316071, 51, 316086, 54,
      316087, 51, 316290, 78, 316294, 78, 316306, 73, 316310, 73, 318085, 77,
      318087, 77, 318117, 70, 318119, 70, 318336, 79, 318337, 79, 318338, 78,
      318341, 77, 318342, 78, 318343, 77, 430776, 56, 430777, 56, 430778, 53,
      430781, 50, 430782, 53, 430783, 50, 431000, 75, 431002, 72, 431032, 75,
      431034, 72, 432809, 74, 432813, 69, 432825, 74, 432829, 69, 433032, 76,
      433033, 76, 433048, 75, 433065, 74, 433080, 75, 433081, 74, 447158, 71,
      447159, 68, 447166, 71, 447167, 68, 447378, 73, 447382, 73, 447386, 72,
      447414, 71, 447418, 72, 447422, 71, 449189, 70, 449191, 70, 449197, 69,
      449207, 68, 449213, 69, 449215, 68, 449408, 67, 449409, 67, 449410, 66,
      449413, 64, 449414, 66, 449415, 64, 449416, 67, 449417, 67, 449426, 66,
      449430, 66, 449432, 65, 449434, 65, 449445, 64, 449447, 64, 449449, 63,
      449453, 63, 449462, 62, 449463, 62, 449464, 65, 449465, 63, 449466, 65,
      449469, 63, 449470, 62, 449471, 62, 449472, 19, 449473, 19, 449474, 18,
      449477, 16, 449478, 18, 449479, 16, 449480, 19, 449481, 19, 449490, 18,
      449494, 18, 449496, 17, 449498, 17, 449509, 16, 449511, 16, 449513, 15,
      449517, 15, 449526, 14, 449527, 14, 449528, 17, 449529, 15, 449530, 17,
      449533, 15, 449534, 14, 449535, 14, 449728, 19, 449729, 19, 449730, 18,
      449734, 18, 449736, 19, 449737, 19, 449746, 18, 449750, 18, 449752, 17,
      449754, 17, 449784, 17, 449786, 17, 451520, 19, 451521, 19, 451525, 16,
      451527, 16, 451528, 19, 451529, 19, 451557, 16, 451559, 16, 451561, 15,
      451565, 15, 451577, 15, 451581, 15, 451776, 19, 451777, 19, 451784, 19,
      451785, 19, 465858, 18, 465861, 16, 465862, 18, 465863, 16, 465874, 18,
      465878, 18, 465893, 16, 465895, 16, 465910, 14, 465911, 14, 465918, 14,
      465919, 14, 466114, 18, 466118, 18, 466130, 18, 466134, 18, 467909, 16,
      467911, 16, 467941, 16, 467943, 16, 468160, 13, 468161, 13, 468162, 13,
      468163, 13, 468164, 13, 468165, 13, 468166, 13, 468167, 13, 580568, 17,
      580570, 17, 580585, 15, 580589, 15, 580598, 14, 580599, 14, 580600, 17,
      580601, 15, 580602, 17, 580605, 15, 580606, 14, 580607, 14, 580824, 17,
      580826, 17, 580856, 17, 580858, 17, 582633, 15, 582637, 15, 582649, 15,
      582653, 15, 582856, 12, 582857, 12, 582872, 12, 582873, 12, 582888, 12,
      582889, 12, 582904, 12, 582905, 12, 596982, 14, 596983, 14, 596990, 14,
      596991, 14, 597202, 11, 597206, 11, 597210, 11, 597214, 11, 597234, 11,
      597238, 11, 597242, 11, 597246, 11, 599013, 10, 599015, 10, 599021, 10,
      599023, 10, 599029, 10, 599031, 10, 599037, 10, 599039, 10, 599232, 13,
      599233, 13, 599234, 13, 599235, 13, 599236, 13, 599237, 13, 599238, 13,
      599239, 13, 599240, 12, 599241, 12, 599250, 11, 599254, 11, 599256, 12,
      599257, 12, 599258, 11, 599262, 11, 599269, 10, 599271, 10, 599272, 12,
      599273, 12, 599277, 10, 599279, 10, 599282, 11, 599285, 10, 599286, 11,
      599287, 10, 599288, 12, 599289, 12, 599290, 11, 599293, 10, 599294, 11,
      599295, 10,
    ],
    p2D: [
      0, 0, 1, -1, 0, 0, -1, 1, 0, 2, 1, 1, 1, 2, 2, 0, 1, 2, 0, 2, 1, 0, 0, 0,
    ],
    p3D: [
      0, 0, 1, -1, 0, 0, 1, 0, -1, 0, 0, -1, 1, 0, 0, 0, 1, -1, 0, 0, -1, 0, 1,
      0, 0, -1, 1, 0, 2, 1, 1, 0, 1, 1, 1, -1, 0, 2, 1, 0, 1, 1, 1, -1, 1, 0, 2,
      0, 1, 1, 1, -1, 1, 1, 1, 3, 2, 1, 0, 3, 1, 2, 0, 1, 3, 2, 0, 1, 3, 1, 0,
      2, 1, 3, 0, 2, 1, 3, 0, 1, 2, 1, 1, 1, 0, 0, 2, 2, 0, 0, 1, 1, 0, 1, 0, 2,
      0, 2, 0, 1, 1, 0, 0, 1, 2, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, -1, 1, 2, 0, 0,
      0, 0, 1, -1, 1, 1, 2, 0, 0, 0, 0, 1, 1, 1, -1, 2, 3, 1, 1, 1, 2, 0, 0, 2,
      2, 3, 1, 1, 1, 2, 2, 0, 0, 2, 3, 1, 1, 1, 2, 0, 2, 0, 2, 1, 1, -1, 1, 2,
      0, 0, 2, 2, 1, 1, -1, 1, 2, 2, 0, 0, 2, 1, -1, 1, 1, 2, 0, 0, 2, 2, 1, -1,
      1, 1, 2, 0, 2, 0, 2, 1, 1, 1, -1, 2, 2, 0, 0, 2, 1, 1, 1, -1, 2, 0, 2, 0,
    ],
    p4D: [
      0, 0, 1, -1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 1, 0, 0, 0,
      0, 1, -1, 0, 0, 0, 1, 0, -1, 0, 0, -1, 0, 1, 0, 0, 0, -1, 1, 0, 0, 0, 0,
      1, -1, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, -1, 1, 0, 2, 1, 1, 0,
      0, 1, 1, 1, -1, 0, 1, 1, 1, 0, -1, 0, 2, 1, 0, 1, 0, 1, 1, -1, 1, 0, 1, 1,
      0, 1, -1, 0, 2, 0, 1, 1, 0, 1, -1, 1, 1, 0, 1, 0, 1, 1, -1, 0, 2, 1, 0, 0,
      1, 1, 1, -1, 0, 1, 1, 1, 0, -1, 1, 0, 2, 0, 1, 0, 1, 1, -1, 1, 0, 1, 1, 0,
      1, -1, 1, 0, 2, 0, 0, 1, 1, 1, -1, 0, 1, 1, 1, 0, -1, 1, 1, 1, 4, 2, 1, 1,
      0, 4, 1, 2, 1, 0, 4, 1, 1, 2, 0, 1, 4, 2, 1, 0, 1, 4, 1, 2, 0, 1, 4, 1, 1,
      0, 2, 1, 4, 2, 0, 1, 1, 4, 1, 0, 2, 1, 4, 1, 0, 1, 2, 1, 4, 0, 2, 1, 1, 4,
      0, 1, 2, 1, 4, 0, 1, 1, 2, 1, 2, 1, 1, 0, 0, 3, 2, 1, 0, 0, 3, 1, 2, 0, 0,
      1, 2, 1, 0, 1, 0, 3, 2, 0, 1, 0, 3, 1, 0, 2, 0, 1, 2, 0, 1, 1, 0, 3, 0, 2,
      1, 0, 3, 0, 1, 2, 0, 1, 2, 1, 0, 0, 1, 3, 2, 0, 0, 1, 3, 1, 0, 0, 2, 1, 2,
      0, 1, 0, 1, 3, 0, 2, 0, 1, 3, 0, 1, 0, 2, 1, 2, 0, 0, 1, 1, 3, 0, 0, 2, 1,
      3, 0, 0, 1, 2, 2, 3, 1, 1, 1, 0, 2, 1, 1, 1, -1, 2, 2, 0, 0, 0, 2, 3, 1,
      1, 0, 1, 2, 1, 1, -1, 1, 2, 2, 0, 0, 0, 2, 3, 1, 0, 1, 1, 2, 1, -1, 1, 1,
      2, 2, 0, 0, 0, 2, 3, 1, 1, 1, 0, 2, 1, 1, 1, -1, 2, 0, 2, 0, 0, 2, 3, 1,
      1, 0, 1, 2, 1, 1, -1, 1, 2, 0, 2, 0, 0, 2, 3, 0, 1, 1, 1, 2, -1, 1, 1, 1,
      2, 0, 2, 0, 0, 2, 3, 1, 1, 1, 0, 2, 1, 1, 1, -1, 2, 0, 0, 2, 0, 2, 3, 1,
      0, 1, 1, 2, 1, -1, 1, 1, 2, 0, 0, 2, 0, 2, 3, 0, 1, 1, 1, 2, -1, 1, 1, 1,
      2, 0, 0, 2, 0, 2, 3, 1, 1, 0, 1, 2, 1, 1, -1, 1, 2, 0, 0, 0, 2, 2, 3, 1,
      0, 1, 1, 2, 1, -1, 1, 1, 2, 0, 0, 0, 2, 2, 3, 0, 1, 1, 1, 2, -1, 1, 1, 1,
      2, 0, 0, 0, 2, 2, 1, 1, 1, -1, 0, 1, 1, 1, 0, -1, 0, 0, 0, 0, 0, 2, 1, 1,
      -1, 1, 0, 1, 1, 0, 1, -1, 0, 0, 0, 0, 0, 2, 1, -1, 1, 1, 0, 1, 0, 1, 1,
      -1, 0, 0, 0, 0, 0, 2, 1, 1, -1, 0, 1, 1, 1, 0, -1, 1, 0, 0, 0, 0, 0, 2, 1,
      -1, 1, 0, 1, 1, 0, 1, -1, 1, 0, 0, 0, 0, 0, 2, 1, -1, 0, 1, 1, 1, 0, -1,
      1, 1, 0, 0, 0, 0, 0, 2, 1, 1, 1, -1, 0, 1, 1, 1, 0, -1, 2, 2, 0, 0, 0, 2,
      1, 1, -1, 1, 0, 1, 1, 0, 1, -1, 2, 2, 0, 0, 0, 2, 1, 1, -1, 0, 1, 1, 1, 0,
      -1, 1, 2, 2, 0, 0, 0, 2, 1, 1, 1, -1, 0, 1, 1, 1, 0, -1, 2, 0, 2, 0, 0, 2,
      1, -1, 1, 1, 0, 1, 0, 1, 1, -1, 2, 0, 2, 0, 0, 2, 1, -1, 1, 0, 1, 1, 0, 1,
      -1, 1, 2, 0, 2, 0, 0, 2, 1, 1, -1, 1, 0, 1, 1, 0, 1, -1, 2, 0, 0, 2, 0, 2,
      1, -1, 1, 1, 0, 1, 0, 1, 1, -1, 2, 0, 0, 2, 0, 2, 1, -1, 0, 1, 1, 1, 0,
      -1, 1, 1, 2, 0, 0, 2, 0, 2, 1, 1, -1, 0, 1, 1, 1, 0, -1, 1, 2, 0, 0, 0, 2,
      2, 1, -1, 1, 0, 1, 1, 0, 1, -1, 1, 2, 0, 0, 0, 2, 2, 1, -1, 0, 1, 1, 1, 0,
      -1, 1, 1, 2, 0, 0, 0, 2, 3, 1, 1, 0, 0, 0, 2, 2, 0, 0, 0, 2, 1, 1, 1, -1,
      3, 1, 0, 1, 0, 0, 2, 0, 2, 0, 0, 2, 1, 1, 1, -1, 3, 1, 0, 0, 1, 0, 2, 0,
      0, 2, 0, 2, 1, 1, 1, -1, 3, 1, 1, 0, 0, 0, 2, 2, 0, 0, 0, 2, 1, 1, -1, 1,
      3, 1, 0, 1, 0, 0, 2, 0, 2, 0, 0, 2, 1, 1, -1, 1, 3, 1, 0, 0, 0, 1, 2, 0,
      0, 0, 2, 2, 1, 1, -1, 1, 3, 1, 1, 0, 0, 0, 2, 2, 0, 0, 0, 2, 1, -1, 1, 1,
      3, 1, 0, 0, 1, 0, 2, 0, 0, 2, 0, 2, 1, -1, 1, 1, 3, 1, 0, 0, 0, 1, 2, 0,
      0, 0, 2, 2, 1, -1, 1, 1, 3, 1, 0, 1, 0, 0, 2, 0, 2, 0, 0, 2, -1, 1, 1, 1,
      3, 1, 0, 0, 1, 0, 2, 0, 0, 2, 0, 2, -1, 1, 1, 1, 3, 1, 0, 0, 0, 1, 2, 0,
      0, 0, 2, 2, -1, 1, 1, 1, 3, 3, 2, 1, 0, 0, 3, 1, 2, 0, 0, 4, 1, 1, 1, 1,
      3, 3, 2, 0, 1, 0, 3, 1, 0, 2, 0, 4, 1, 1, 1, 1, 3, 3, 0, 2, 1, 0, 3, 0, 1,
      2, 0, 4, 1, 1, 1, 1, 3, 3, 2, 0, 0, 1, 3, 1, 0, 0, 2, 4, 1, 1, 1, 1, 3, 3,
      0, 2, 0, 1, 3, 0, 1, 0, 2, 4, 1, 1, 1, 1, 3, 3, 0, 0, 2, 1, 3, 0, 0, 1, 2,
      4, 1, 1, 1, 1, 3, 3, 2, 1, 0, 0, 3, 1, 2, 0, 0, 2, 1, 1, 1, -1, 3, 3, 2,
      0, 1, 0, 3, 1, 0, 2, 0, 2, 1, 1, 1, -1, 3, 3, 0, 2, 1, 0, 3, 0, 1, 2, 0,
      2, 1, 1, 1, -1, 3, 3, 2, 1, 0, 0, 3, 1, 2, 0, 0, 2, 1, 1, -1, 1, 3, 3, 2,
      0, 0, 1, 3, 1, 0, 0, 2, 2, 1, 1, -1, 1, 3, 3, 0, 2, 0, 1, 3, 0, 1, 0, 2,
      2, 1, 1, -1, 1, 3, 3, 2, 0, 1, 0, 3, 1, 0, 2, 0, 2, 1, -1, 1, 1, 3, 3, 2,
      0, 0, 1, 3, 1, 0, 0, 2, 2, 1, -1, 1, 1, 3, 3, 0, 0, 2, 1, 3, 0, 0, 1, 2,
      2, 1, -1, 1, 1, 3, 3, 0, 2, 1, 0, 3, 0, 1, 2, 0, 2, -1, 1, 1, 1, 3, 3, 0,
      2, 0, 1, 3, 0, 1, 0, 2, 2, -1, 1, 1, 1, 3, 3, 0, 0, 2, 1, 3, 0, 0, 1, 2,
      2, -1, 1, 1, 1,
    ],
  };

  var Contribution2 = /** @class */ (function () {
    function Contribution2(multiplier, xsb, ysb) {
      this.dx = -xsb - multiplier * constants_1.SQUISH_2D;
      this.dy = -ysb - multiplier * constants_1.SQUISH_2D;
      this.xsb = xsb;
      this.ysb = ysb;
    }
    return Contribution2;
  })();
  var Contribution3 = /** @class */ (function () {
    function Contribution3(multiplier, xsb, ysb, zsb) {
      this.dx = -xsb - multiplier * constants_1.SQUISH_3D;
      this.dy = -ysb - multiplier * constants_1.SQUISH_3D;
      this.dz = -zsb - multiplier * constants_1.SQUISH_3D;
      this.xsb = xsb;
      this.ysb = ysb;
      this.zsb = zsb;
    }
    return Contribution3;
  })();
  var Contribution4 = /** @class */ (function () {
    function Contribution4(multiplier, xsb, ysb, zsb, wsb) {
      this.dx = -xsb - multiplier * constants_1.SQUISH_4D;
      this.dy = -ysb - multiplier * constants_1.SQUISH_4D;
      this.dz = -zsb - multiplier * constants_1.SQUISH_4D;
      this.dw = -wsb - multiplier * constants_1.SQUISH_4D;
      this.xsb = xsb;
      this.ysb = ysb;
      this.zsb = zsb;
      this.wsb = wsb;
    }
    return Contribution4;
  })();
  function shuffleSeed(seed) {
    var newSeed = new Uint32Array(1);
    newSeed[0] = seed[0] * 1664525 + 1013904223;
    return newSeed;
  }
  OpenSimplexNoise = /** @class */ (function () {
    function OpenSimplexNoise(clientSeed) {
      this.initialize();
      this.perm = new Uint8Array(256);
      this.perm2D = new Uint8Array(256);
      this.perm3D = new Uint8Array(256);
      this.perm4D = new Uint8Array(256);
      var source = new Uint8Array(256);
      for (var i = 0; i < 256; i++) source[i] = i;
      var seed = new Uint32Array(1);
      seed[0] = clientSeed;
      seed = shuffleSeed(shuffleSeed(shuffleSeed(seed)));
      for (var i = 255; i >= 0; i--) {
        seed = shuffleSeed(seed);
        var r = new Uint32Array(1);
        r[0] = (seed[0] + 31) % (i + 1);
        if (r[0] < 0) r[0] += i + 1;
        this.perm[i] = source[r[0]];
        this.perm2D[i] = this.perm[i] & 0x0e;
        this.perm3D[i] = (this.perm[i] % 24) * 3;
        this.perm4D[i] = this.perm[i] & 0xfc;
        source[r[0]] = source[i];
      }
    }
    OpenSimplexNoise.prototype.array2D = function (width, height) {
      var output = new Array(width);
      for (var x = 0; x < width; x++) {
        output[x] = new Array(height);
        for (var y = 0; y < height; y++) {
          output[x][y] = this.noise2D(x, y);
        }
      }
      return output;
    };
    OpenSimplexNoise.prototype.array3D = function (width, height, depth) {
      var output = new Array(width);
      for (var x = 0; x < width; x++) {
        output[x] = new Array(height);
        for (var y = 0; y < height; y++) {
          output[x][y] = new Array(depth);
          for (var z = 0; z < depth; z++) {
            output[x][y][z] = this.noise3D(x, y, z);
          }
        }
      }
      return output;
    };
    OpenSimplexNoise.prototype.array4D = function (
      width,
      height,
      depth,
      wLength
    ) {
      var output = new Array(width);
      for (var x = 0; x < width; x++) {
        output[x] = new Array(height);
        for (var y = 0; y < height; y++) {
          output[x][y] = new Array(depth);
          for (var z = 0; z < depth; z++) {
            output[x][y][z] = new Array(wLength);
            for (var w = 0; w < wLength; w++) {
              output[x][y][z][w] = this.noise4D(x, y, z, w);
            }
          }
        }
      }
      return output;
    };
    OpenSimplexNoise.prototype.noise2D = function (x, y) {
      var stretchOffset = (x + y) * constants_1.STRETCH_2D;
      var xs = x + stretchOffset;
      var ys = y + stretchOffset;
      var xsb = Math.floor(xs);
      var ysb = Math.floor(ys);
      var squishOffset = (xsb + ysb) * constants_1.SQUISH_2D;
      var dx0 = x - (xsb + squishOffset);
      var dy0 = y - (ysb + squishOffset);
      var xins = xs - xsb;
      var yins = ys - ysb;
      var inSum = xins + yins;
      var hash =
        (xins - yins + 1) |
        (inSum << 1) |
        ((inSum + yins) << 2) |
        ((inSum + xins) << 4);
      var value = 0;
      for (var c = this.lookup2D[hash]; c !== undefined; c = c.next) {
        var dx = dx0 + c.dx;
        var dy = dy0 + c.dy;
        var attn = 2 - dx * dx - dy * dy;
        if (attn > 0) {
          var px = xsb + c.xsb;
          var py = ysb + c.ysb;
          var indexPartA = this.perm[px & 0xff];
          var index = this.perm2D[(indexPartA + py) & 0xff];
          var valuePart =
            constants_1.gradients2D[index] * dx +
            constants_1.gradients2D[index + 1] * dy;
          value += attn * attn * attn * attn * valuePart;
        }
      }
      return value * constants_1.NORM_2D;
    };
    OpenSimplexNoise.prototype.noise3D = function (x, y, z) {
      var stretchOffset = (x + y + z) * constants_1.STRETCH_3D;
      var xs = x + stretchOffset;
      var ys = y + stretchOffset;
      var zs = z + stretchOffset;
      var xsb = Math.floor(xs);
      var ysb = Math.floor(ys);
      var zsb = Math.floor(zs);
      var squishOffset = (xsb + ysb + zsb) * constants_1.SQUISH_3D;
      var dx0 = x - (xsb + squishOffset);
      var dy0 = y - (ysb + squishOffset);
      var dz0 = z - (zsb + squishOffset);
      var xins = xs - xsb;
      var yins = ys - ysb;
      var zins = zs - zsb;
      var inSum = xins + yins + zins;
      var hash =
        (yins - zins + 1) |
        ((xins - yins + 1) << 1) |
        ((xins - zins + 1) << 2) |
        (inSum << 3) |
        ((inSum + zins) << 5) |
        ((inSum + yins) << 7) |
        ((inSum + xins) << 9);
      var value = 0;
      for (var c = this.lookup3D[hash]; c !== undefined; c = c.next) {
        var dx = dx0 + c.dx;
        var dy = dy0 + c.dy;
        var dz = dz0 + c.dz;
        var attn = 2 - dx * dx - dy * dy - dz * dz;
        if (attn > 0) {
          var px = xsb + c.xsb;
          var py = ysb + c.ysb;
          var pz = zsb + c.zsb;
          var indexPartA = this.perm[px & 0xff];
          var indexPartB = this.perm[(indexPartA + py) & 0xff];
          var index = this.perm3D[(indexPartB + pz) & 0xff];
          var valuePart =
            constants_1.gradients3D[index] * dx +
            constants_1.gradients3D[index + 1] * dy +
            constants_1.gradients3D[index + 2] * dz;
          value += attn * attn * attn * attn * valuePart;
        }
      }
      return value * constants_1.NORM_3D;
    };
    OpenSimplexNoise.prototype.noise4D = function (x, y, z, w) {
      var stretchOffset = (x + y + z + w) * constants_1.STRETCH_4D;
      var xs = x + stretchOffset;
      var ys = y + stretchOffset;
      var zs = z + stretchOffset;
      var ws = w + stretchOffset;
      var xsb = Math.floor(xs);
      var ysb = Math.floor(ys);
      var zsb = Math.floor(zs);
      var wsb = Math.floor(ws);
      var squishOffset = (xsb + ysb + zsb + wsb) * constants_1.SQUISH_4D;
      var dx0 = x - (xsb + squishOffset);
      var dy0 = y - (ysb + squishOffset);
      var dz0 = z - (zsb + squishOffset);
      var dw0 = w - (wsb + squishOffset);
      var xins = xs - xsb;
      var yins = ys - ysb;
      var zins = zs - zsb;
      var wins = ws - wsb;
      var inSum = xins + yins + zins + wins;
      var hash =
        (zins - wins + 1) |
        ((yins - zins + 1) << 1) |
        ((yins - wins + 1) << 2) |
        ((xins - yins + 1) << 3) |
        ((xins - zins + 1) << 4) |
        ((xins - wins + 1) << 5) |
        (inSum << 6) |
        ((inSum + wins) << 8) |
        ((inSum + zins) << 11) |
        ((inSum + yins) << 14) |
        ((inSum + xins) << 17);
      var value = 0;
      for (var c = this.lookup4D[hash]; c !== undefined; c = c.next) {
        var dx = dx0 + c.dx;
        var dy = dy0 + c.dy;
        var dz = dz0 + c.dz;
        var dw = dw0 + c.dw;
        var attn = 2 - dx * dx - dy * dy - dz * dz - dw * dw;
        if (attn > 0) {
          var px = xsb + c.xsb;
          var py = ysb + c.ysb;
          var pz = zsb + c.zsb;
          var pw = wsb + c.wsb;
          var indexPartA = this.perm[px & 0xff];
          var indexPartB = this.perm[(indexPartA + py) & 0xff];
          var indexPartC = this.perm[(indexPartB + pz) & 0xff];
          var index = this.perm4D[(indexPartC + pw) & 0xff];
          var valuePart =
            constants_1.gradients4D[index] * dx +
            constants_1.gradients4D[index + 1] * dy +
            constants_1.gradients4D[index + 2] * dz +
            constants_1.gradients4D[index + 3] * dw;
          value += attn * attn * attn * attn * valuePart;
        }
      }
      return value * constants_1.NORM_4D;
    };
    OpenSimplexNoise.prototype.initialize = function () {
      var contributions2D = [];
      for (var i = 0; i < constants_1.p2D.length; i += 4) {
        var baseSet = constants_1.base2D[constants_1.p2D[i]];
        var previous = null;
        var current = null;
        for (var k = 0; k < baseSet.length; k += 3) {
          current = new Contribution2(
            baseSet[k],
            baseSet[k + 1],
            baseSet[k + 2]
          );
          if (previous === null) contributions2D[i / 4] = current;
          else previous.next = current;
          previous = current;
        }
        current.next = new Contribution2(
          constants_1.p2D[i + 1],
          constants_1.p2D[i + 2],
          constants_1.p2D[i + 3]
        );
      }
      this.lookup2D = [];
      for (var i = 0; i < constants_1.lookupPairs2D.length; i += 2) {
        this.lookup2D[constants_1.lookupPairs2D[i]] =
          contributions2D[constants_1.lookupPairs2D[i + 1]];
      }
      var contributions3D = [];
      for (var i = 0; i < constants_1.p3D.length; i += 9) {
        var baseSet = constants_1.base3D[constants_1.p3D[i]];
        var previous = null;
        var current = null;
        for (var k = 0; k < baseSet.length; k += 4) {
          current = new Contribution3(
            baseSet[k],
            baseSet[k + 1],
            baseSet[k + 2],
            baseSet[k + 3]
          );
          if (previous === null) contributions3D[i / 9] = current;
          else previous.next = current;
          previous = current;
        }
        current.next = new Contribution3(
          constants_1.p3D[i + 1],
          constants_1.p3D[i + 2],
          constants_1.p3D[i + 3],
          constants_1.p3D[i + 4]
        );
        current.next.next = new Contribution3(
          constants_1.p3D[i + 5],
          constants_1.p3D[i + 6],
          constants_1.p3D[i + 7],
          constants_1.p3D[i + 8]
        );
      }
      this.lookup3D = [];
      for (var i = 0; i < constants_1.lookupPairs3D.length; i += 2) {
        this.lookup3D[constants_1.lookupPairs3D[i]] =
          contributions3D[constants_1.lookupPairs3D[i + 1]];
      }
      var contributions4D = [];
      for (var i = 0; i < constants_1.p4D.length; i += 16) {
        var baseSet = constants_1.base4D[constants_1.p4D[i]];
        var previous = null;
        var current = null;
        for (var k = 0; k < baseSet.length; k += 5) {
          current = new Contribution4(
            baseSet[k],
            baseSet[k + 1],
            baseSet[k + 2],
            baseSet[k + 3],
            baseSet[k + 4]
          );
          if (previous === null) contributions4D[i / 16] = current;
          else previous.next = current;
          previous = current;
        }
        current.next = new Contribution4(
          constants_1.p4D[i + 1],
          constants_1.p4D[i + 2],
          constants_1.p4D[i + 3],
          constants_1.p4D[i + 4],
          constants_1.p4D[i + 5]
        );
        current.next.next = new Contribution4(
          constants_1.p4D[i + 6],
          constants_1.p4D[i + 7],
          constants_1.p4D[i + 8],
          constants_1.p4D[i + 9],
          constants_1.p4D[i + 10]
        );
        current.next.next.next = new Contribution4(
          constants_1.p4D[i + 11],
          constants_1.p4D[i + 12],
          constants_1.p4D[i + 13],
          constants_1.p4D[i + 14],
          constants_1.p4D[i + 15]
        );
      }
      this.lookup4D = [];
      for (var i = 0; i < constants_1.lookupPairs4D.length; i += 2) {
        this.lookup4D[constants_1.lookupPairs4D[i]] =
          contributions4D[constants_1.lookupPairs4D[i + 1]];
      }
    };
    return OpenSimplexNoise;
  })();
})();
