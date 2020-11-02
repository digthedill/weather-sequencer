let synth;
let seq;
let rev, dist, feedbackDelay, chorus, pingPong, bitCrush;

const transport = Tone.Transport;

const synthB = new Tone.PolySynth().toMaster();
// set the attributes across all the voices using 'set'
synthB.set({ detune: -1200 });

const weatherForm = document.querySelector("form");
const search = document.querySelector("input");
let searchBtn = document.querySelector("#searchBtn");
const stopBtn = document.querySelector("#stop");

const title = document.querySelector("#title");
const temp = document.querySelector("#temp");
const des = document.querySelector("#des");

// ************Create a toggle between search and stop **********

const getData = () => {
  const location = search.value;
  return fetch(`/weather?address=${location}`).then((res) => {
    res.json().then((data) => {
      try {
        song(data);
        title.textContent = data.location;
        temp.textContent = data.temp + " ° F";
        des.textContent = data.description;
      } catch (e) {
        console.log(e);
      }
    });
  });
};

weatherForm.addEventListener("submit", (e) => {
  e.preventDefault();
  title.textContent = "loading. . .";
  temp.textContent = "";
  des.textContent = "";
  getData();
});

stopBtn.addEventListener("click", () => {
  seq.stop();
  searchBtn.disabled = false;
  searchBtn.focus();
});

const time = new Date();
const displayTime = time.toLocaleTimeString("en-GB");

//********************************effects****************************************************
feedbackDelay = new Tone.FeedbackDelay(delaytime(displayTime), 0.5).toMaster();

rev = new Tone.Freeverb({
  roomSize: 0.9,
  dampening: 10000,
  wet: 0.1,
}).toMaster();

dist = new Tone.Distortion().toMaster();

//weak chorus
chorus = new Tone.Chorus(3, 2.5, 0.5).toMaster();

pingPong = new Tone.PingPongDelay("1m", 0.7).toMaster();

bitCrush = new Tone.BitCrusher(10).toMaster();

//****************************************************************************************** */
//*******************synthesizer initialization/defaults (Tone.js) *************************
synth = new Tone.Synth({
  oscillator: {
    type: "sawtooth",
  },
  envelope: {
    attack: 0.3,
    decay: 0.9,
    sustain: 0.1,
    release: 2,
  },
}).toMaster();
synth.connect(feedbackDelay);
synth.chain(rev, chorus);
Tone.Transport.start().bpm.value = timeToBPM(displayTime);

//*************Convert weather description into a sequence of notes ******* */
function grabDescription(data) {
  let current = data.description.toLowerCase();
  //refactor with Object.keys
  let availableDescriptors = [
    "clear",
    "overcast",
    "rain",
    "mist",
    "cloudy",
    "snow",
    "sunny",
    "thunderstorm",
    "fog",
    "light",
    "blizzard",
    "torrential",
  ];
  let match = availableDescriptors.findIndex((description) =>
    current.includes(description)
  );
  current = availableDescriptors[match];
  const sequences = {
    torrential: ["f3", "e3", "f3", "d3", "a3", "b3"],
    fog: ["d3", ["a#3", "g3"], "d#2", "a#3", "d3"],
    clear: ["c4", "f4", "g4", "a#4", ["f4", "c4"], "g4", "e4", "g3"],
    overcast: ["d2", "f3", "a#3", [["d2", "g3"], "c3"], "a3", "f3", "a2"],
    rain: [
      "a#2",
      "f#3",
      ["g#3", "f4"],
      "d#3",
      "f#2",
      ["d#3", "f#2"],
      "a#3",
      "c#4",
    ],
    mist: ["e3", "f#3", "g#3", "a#3", ["g#2", "c#3"], "g#3", "c#4"],
    cloudy: [
      "g2",
      "d3",
      ["f3", "d3"],
      "f3",
      ["d3", "a#2"],
      "c3",
      "d4",
      ["f3", "a#3", "g3"],
    ],
    snow: ["c#4", "a#3", ["c#4", "a#3", "d#3", "f#3"], "d#3", "f#3"],
    sunny: ["c4", ["g3", "a3"], "f2", ["b3", "c4"], "g3", ["e3", "g3"], "e4"],
    thunderstorm: [["f#3", "e3", "c#3"], "e3", "g#3", "c#4", ["g#2", "b2"]],
    light: [
      "g3",
      "d3",
      ["g3", "d3"],
      "f3",
      ["g3", "d3", "f3"],
      "a#3",
      "c3",
      "d2",
    ],
    blizzard: ["f3", "c3", "f2", "g#2", ["a#3", "f3"], "b3", "c3", "a#2", "f2"],
  };
  let currentForecast = [];
  for (let forecast in sequences) {
    let value = sequences[forecast];
    if (forecast === current) {
      currentForecast = value;
    }
  }
  return currentForecast || sequences.clear;
}

// ********************Initialize Song**************************

//Need to setup search button so it clears current sequence

function song(data) {
  //Tone sequencer
  seq = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(note, 0.1, time, 0.6);
    synthB.triggerAttackRelease(note, 0.01, time, 0.3);
  }, grabDescription(data));

  if (seq.state === "stopped") {
    if (Tone.context.state !== "running") {
      Tone.context.resume();
    }
    searchBtn.disabled = true;
    stopBtn.focus();

    // **************temperature conditional logic *********************
    if (data.temp > 45 && data.temp < 60) {
      //moderately average
      synth.set({
        envelope: {
          attack: 0.7,
          decay: 0.1,
          sustain: 0.3,
          release: 4,
        },
      });
    } else if (data.temp > 60 && data.temp < 78) {
      synth.connect(rev);
      //moderately nice
      synth.set({ detune: +1200 });
      synthB.set({ detune: +1200 });

      synth.set({
        oscillator: {
          type: "sawtooth",
        },
        envelope: {
          attack: 0.9,
          decay: 0.5,
          sustain: 0.1,
          release: 2,
        },
      });
    } else if (data.temp > 35 && data.temp < 55) {
      //chilly
      synth.connect(pingPong);
      synth.set({
        envelope: {
          attack: 0.7,
          decay: 0.01,
          sustain: 0.01,
          release: 3,
        },
      });
    } else if (data.temp > 89) {
      ///////REALLLYYYY HOT
      synth.chain(rev, shift, pingPong);
      synth.set({
        envelope: {
          attack: 0.005,
          decay: 0.9,
          sustain: 0.3,
          release: 5,
        },
      });
    } else if (data.temp < 28) {
      /////////COLD AS FUCK
      synth.chain(bitCrush, pingPong);
      synth.connect(pingPong);
      synth.set({
        envelope: {
          attack: 0.7,
          decay: 0.5,
          sustain: 0.3,
          release: 6,
        },
      });
    } ///  need to fix the else statement to recieve else logic
    seq.start();
  }

  //never hitting these functions
  if (Tone.context.state === "running") {
    console.log("else statement achieved");
    Tone.Transport.clear();
  }
}

//Range Functions

function timeToBPM(time) {
  const hour = parseInt(time.slice(0, 2));
  const bpmMin = 50;
  const bpmMax = 80;
  const timeRange = 23 - 0;
  const bpmRange = bpmMax - bpmMin;

  const bpm = (((hour - 0) * bpmRange) / timeRange + bpmMin).toFixed();
  console.log("bpm:", bpm, "at", time);
  return bpm;
}

function delaytime(time) {
  const hour = parseInt(time.slice(0, 2));
  const delayRange = 1 - 0.5; //min and max
  const timeRange = 23 - 0; //reverse min and max
  const delay = ((hour - 0) * delayRange) / timeRange + 0.4;
  return delay;
}

//PTS.js practice

export { synth, transport };
