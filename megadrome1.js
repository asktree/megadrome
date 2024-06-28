// by cam, fork of emmy's VJ scene
// TODO: add more comments
// set more things as sliders, dropdowns, etc
// add "DROP" button
// add "UNDROP" button
// GAMMA: 3

// use this instead of console.log if in the main loop

let mic;

let bgColorSolid = null;
let bgColorTranslucent = null;
let spectrumLevels;

const FPS = 60;

var ORIGIN_X = merlinSlider(-200, 200, 0, 1);
var ORIGIN_Y = merlinSlider(-200, 200, 0, 1);
var HUE_OFFSET = merlinSlider(0, 255, 175, 1);
var HUE_RANGE = merlinSlider(-256, 255, 0, 1);
var ROTATION_SPEED = merlinSlider(0, 2, 1, 0.01);
var ROTATION_SCALE = merlinSlider(0, 0.2, 0.02, 0.01);
var D_SPEED = merlinSlider(0, 2, 1, 0.01, "Impact LX25+ MIDI2:0xbf:0x13");
var D_SCALE = merlinSlider(0, 5, 2, 0.01, "Impact LX25+ MIDI2:0xbf:0xf");
var PULSE_OCTAVE = merlinSlider(0, 32, 0, 1);
var PULSE_SIZE = merlinSlider(0, 10, 0, 0.1);
var MIC_MEMORY_SECONDS = merlinSlider(1, 60, 5, 1);
var NORMALIZATION_WEIGHT = merlinSlider(0, 100, 50, 1);
var OVERRIDE_NORMALIZATION = merlinSlider(0, 1, 0, 1);
var EQ_CURVE = merlinCurve("one");
var MAX_NORM_CURVE = merlinCurve("one");
var MIN_NORM_CURVE = merlinCurve("zero");
const SMOOTHING_COEFF = 0.4;

let buckets = [];
function setup() {
  buckets = perlinBuckets();
  createCanvas(43, 66);

  // Gets a reference to computer's microphone
  // https://p5js.org/reference/#/p5.AudioIn
  mic = new p5.AudioIn();

  // Start processing audio input
  // https://p5js.org/reference/#/p5.AudioIn/start
  mic.start();

  // Helpful for debugging
  printAudioSourceInformation();

  const numFftBins = 256; // Defaults to 1024. Must be power of 2.
  fft = new p5.FFT(SMOOTHING_COEFF, numFftBins);
  fft.setInput(mic);

  // frameRate(20);
  bgColorSolid = color(10);
  bgColorTranslucent = color(30, 2);
  background(bgColorSolid);

  colorMode(HSB, 255);
  noStroke();
  spectrumLevels = Array(33)
    .fill()
    .map(() => Array(MIC_MEMORY_SECONDS * FPS, 0.5));
}

function calculateAngle(x1, y1, x2, y2) {
  // Calculate the angle in radians
  const angleRadians = Math.atan2(y2 - y1, x2 - x1);

  // Convert radians to degrees
  const angleDegrees = angleRadians * (180 / Math.PI);

  return angleDegrees;
}

let rotato = 10000;
let distato = 0;
const merlinLog = (msg) => {
  if (frameRate % 30 == 0) console.log(msg);
  // console.log(msg)
};

// Returns an array of amplitude values (between 0 and 255) across the frequency spectrum.
// See: https://p5js.org/reference/#/p5.FFT/analyze
const minFreqAmplitude = 0,
  maxFreqAmplitude = 255;

function draw() {
  const uneditedSpectrum = getEnergies();
  const ENERGIES_LENGTH = uneditedSpectrum.length;

  const spectrum = Array(ENERGIES_LENGTH);
  const highestLevels = Array(ENERGIES_LENGTH, 1);
  const lowestLevels = Array(ENERGIES_LENGTH, 0);

  // normalize levels
  for (let i = 0; i < ENERGIES_LENGTH; i += 1) {
    spectrumLevels[i].push(uneditedSpectrum[i]);
    if (spectrumLevels[i].length > MIC_MEMORY_SECONDS * FPS) {
      spectrumLevels[i] = spectrumLevels[i].splice(
        -1 * MIC_MEMORY_SECONDS * FPS
      );
    }

    if (OVERRIDE_NORMALIZATION) {
      // if OVERRIDE_NORMALIZATION, use the normalization max and min curves in the params
      const energyBinLocation = map(i, 0, ENERGIES_LENGTH - 1, 0, 1);

      const interpolatedHigh = MAX_NORM_CURVE(i);
      const mappedInterpHigh = map(interpolatedHigh, 0, 1, 0, 255);
      highestLevels[i] = mappedInterpHigh;

      const interpolatedLow = MIN_NORM_CURVE(i);
      const mappedInterpLow = map(interpolatedLow, 0, 1, 0, 255);
      print(mappedInterpLow);
      lowestLevels[i] = mappedInterpLow;
    } else {
      highestLevels[i] = Math.max(...spectrumLevels[i], 10);
      lowestLevels[i] = Math.min(...spectrumLevels[i]);
    }

    spectrum[i] =
      ((uneditedSpectrum[i] - lowestLevels[i]) /
        (highestLevels[i] - lowestLevels[i])) *
        255 || 0;

    //spectrum[i] = (spectrum[i] * NORMALIZATION_WEIGHT + uneditedSpectrum[i] * (100 - NORMALIZATION_WEIGHT)) / 100
    //if (Math.random() < 0.001) {console.log(spectrum[i])}

    spectrum[i] =
      (spectrum[i] / maxFreqAmplitude) *
      (uneditedSpectrum[i] / maxFreqAmplitude) *
      maxFreqAmplitude;
    const energyBinLocation = map(i, 0, ENERGIES_LENGTH - 1, 0, 1);
    // between 0 and 1 according to curve
    merlinLog(energyBinLocation);
    const modifiedVal = EQ_CURVE(energyBinLocation);
    // between 0 and 255
    spectrum[i] *= modifiedVal;
  }

  rotato += (Number(ROTATION_SPEED) - 1) / 10;
  distato += (Number(D_SPEED) - 1) / 10;

  //background(5, 5, 5, 1);
  background(bgColorTranslucent);

  const d_offset = (-spectrum[Number(PULSE_OCTAVE)] * Number(PULSE_SIZE)) / 255;
  const global_hue_shift = Number(HUE_OFFSET); //+ spectrum[3]

  for (var x = 0; x < width; x += 1) {
    for (var y = 0; y < height; y += 1) {
      const d =
        Math.hypot(
          x / 2 - ORIGIN_X - width / 4,
          y / 2 - ORIGIN_Y - height / 4
        ) /
          5 +
        d_offset;

      // this angle calc is fucked or something.
      const rn = noise(
        d * Number(D_SCALE) + distato,
        calculateAngle(
          ORIGIN_X + width / 2,
          ORIGIN_Y + height / 2,
          x - ORIGIN_X,
          y - ORIGIN_Y
        ) *
          Number(ROTATION_SCALE) -
          rotato
      );
      const f1 = rn;

      //var f1 = noise(x/1.5,y/2+frameCount/30)
      var f = buckets.findIndex((z) => z > f1) / buckets.length;
      var freq = Math.floor(spectrum.length * f);
      var huef = (255 * 10 + (f * Number(HUE_RANGE) + global_hue_shift)) % 255;

      fill(huef, 255, spectrum[freq]);
      rect(x, y, 10, 10);
    }
  }
}

function getEnergies() {
  fft.analyze();
  const bands = fft.getOctaveBands(1);
  const bandEnergies = fft.logAverages(bands);
  return bandEnergies;
}

function perlinBuckets() {
  const buckets = [];
  for (var n = 0; n < 255; n += 1) {
    buckets.push(noise(1000000 * Math.random(), 1000000 * Math.random()));
  }
  buckets.sort();
  return buckets;
}

function printAudioSourceInformation() {
  // let micSamplingRate = sampleRate();
  print(mic);

  // For debugging, it's useful to print out this information
  // https://p5js.org/reference/#/p5.AudioIn/getSources
  mic.getSources(function (devices) {
    print("Your audio devices: ");
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
    devices.forEach(function (device) {
      print(
        "  " + device.kind + ": " + device.label + " id = " + device.deviceId
      );
    });
  });
  print("Sampling rate:", sampleRate());

  // Helpful to determine if the microphone state changes
  getAudioContext().onstatechange = function () {
    print("getAudioContext().onstatechange", getAudioContext().state);
  };
}
