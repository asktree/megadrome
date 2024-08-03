/** its a dancing cube
 * emmy jul 1 24
 */
var HUE_OFFSET = merlinSlider(0, 100, 0, 0.001, "Launch Control XL:0xb0:0x13"); // k3A
var HUE_RANGE = merlinSlider(
  -100,
  100,
  0,
  0.001,
  "Launch Control XL:0xb0:0x14" // k3B
);
var PULSE_OCTAVE = merlinSlider(0, 11, 2, 1);
var BASE_SIZE = merlinSlider(0, 20, 5, 0.01, "Launch Control XL:0xb0:0x37");
var PULSE_SIZE = merlinSlider(0, 20, 5, 0.01, "Launch Control XL:0xb0:0x38");
var BOX_SOLID = merlinSlider(0, 1, 0, 1);
var SPINX_OFFSET = merlinSlider(-4, 4, 0, 0.01, "Launch Control XL:0xb0:0x53");
var SPINY_OFFSET = merlinSlider(-4, 4, 0, 0.01, "Launch Control XL:0xb0:0x54");
var BOX_FILL_BRIGHTNESS = merlinSlider(0, 100, 100, 0.1);
var X_OFFSET = merlinSlider(-30, 30, 0, 0.01, "Launch Control XL:0xb0:0x23");
var Y_OFFSET = merlinSlider(-40, 40, 0, 0.01, "Launch Control XL:0xb0:0x24");

var SMOOTHING_COEFF = 0.5;
var ROLLING_FRAME_COUNT = 2;
const HISTORY_BUFFER_SECONDS = 8;

let getEnergies;
let getCentroid;

function setup() {
  createCanvas(43, 66, WEBGL);
  colorMode(HSB, 100);
  // Your setup code here

  getEnergies = createAudioSmoother(
    createAudioNormalizer(createEnergyGetter())
  );
  getCentroid = createCentroidGetter();
}

function draw() {
  // Your draw code here
  clear();
  cube(10, 255);
}

function cube() {
  const energies = getEnergies();
  const centroid = getCentroid();

  const maxFrequency = 11025; // Assuming the max frequency is half the Nyquist frequency for a 22050 Hz sample rate
  const minFrequency = 20; // Assuming the lowest audible frequency
  const logBase = Math.log2(maxFrequency / minFrequency); // Total range in octaves
  const normalizedCentroid = Math.log2(centroid / minFrequency) / logBase;

  const pulseman = energies[PULSE_OCTAVE];

  if (Math.random() < 0.01) {
    console.log(normalizedCentroid);
  }
  const hue = (100 * normalizedCentroid + HUE_OFFSET) % 100;

  BOX_SOLID == 1 ? fill(hue, 90, BOX_FILL_BRIGHTNESS) : noFill();

  const size = BASE_SIZE + pulseman * PULSE_SIZE;

  stroke((50 + hue) % 100, 100, 90);
  strokeWeight(0.2 * (BASE_SIZE + pulseman * PULSE_SIZE));
  //strokeWeight(4*pulseman**2)

  translate(X_OFFSET, Y_OFFSET, pulseman * 20);
  rotateX(frameCount * 0.01 + SPINX_OFFSET);
  rotateY(frameCount * 0.01 + SPINY_OFFSET);
  box(size);
}

// AUDIO UTILS from sex
// ----------------

function createEnergyGetter() {
  // Gets a reference to computer's microphone
  // https://p5js.org/reference/#/p5.AudioIn
  const mic = new p5.AudioIn();
  // Start processing audio input
  // https://p5js.org/reference/#/p5.AudioIn/start
  mic.start();
  // used to be 256. why?
  const numFftBins = 1024; // Defaults to 1024. Must be power of 2.
  const fft = new p5.FFT(SMOOTHING_COEFF, numFftBins);
  fft.setInput(mic);

  return () => {
    fft.analyze();
    const bands = fft.getOctaveBands(1);
    const bandEnergies = fft.logAverages(bands);
    return bandEnergies.map((x) => x / 255).slice(0, -2); //can do slice(0, -2) to cut last 2 octaves
  };
}

function createCentroidGetter() {
  // Gets a reference to computer's microphone
  // https://p5js.org/reference/#/p5.AudioIn
  const mic = new p5.AudioIn();
  // Start processing audio input
  // https://p5js.org/reference/#/p5.AudioIn/start
  mic.start();
  // used to be 256. why?
  const numFftBins = 1024; // Defaults to 1024. Must be power of 2.
  const fft = new p5.FFT(SMOOTHING_COEFF, numFftBins);
  fft.setInput(mic);
  return () => {
    fft.analyze();
    return fft.getCentroid();
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
