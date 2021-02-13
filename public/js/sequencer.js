let synth;
let seq;
let rev, dist, feedbackDelay, chorus, pingPong, bitCrush;
const transport = Tone.Transport;

const synthB = new Tone.PolySynth().toDestination();
// set the attributes across all the voices using 'set'
synthB.set({ detune: -1200 });

const weatherForm = document.querySelector("form");
const search = document.querySelector("input");
let searchBtn = document.querySelector("#searchBtn");
const stopBtn = document.querySelector("#stopBtn");

const title = document.querySelector("#title");
const temp = document.querySelector("#temp");
const des = document.querySelector("#des");
// const vol = document.querySelector("#volume");

// ************Create a toggle between search and stop **********

//idea to add a kick toggle if the user wants a beat

stopBtn.style.visibility = "hidden";

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

weatherForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await Tone.start();
  // searchBtn.disabled = "true";
  title.textContent = "loading. . .";
  temp.textContent = "";
  des.textContent = "";
  getData();
});

stopBtn.addEventListener("mousedown", (e) => {
  e.preventDefault();
  stopBtn.style.visibility = "hidden";
  searchBtn.style.display = "inline";
  transport.stop();
  transport.clear();
  transport.cancel();

  title.textContent = "";
  temp.textContent = "";
  des.textContent = "";
});

const time = new Date();
const displayTime = time.toLocaleTimeString("en-GB");

//********************************effects****************************************************
feedbackDelay = new Tone.FeedbackDelay({
  delayTime: 0.5,
  maxDelay: 0.5,
  feedback: 0.4,
});

rev = new Tone.Freeverb({
  roomSize: 0.8,
  dampening: 400,
  wet: 0.2,
});

dist = new Tone.Distortion(0.1);
//weak chorus
chorus = new Tone.Chorus(1, 2.5, 0.5);

pingPong = new Tone.PingPongDelay("1m", 0.7);

bitCrush = new Tone.BitCrusher(3);

//****************************************************************************************** */
//*******************synthesizer initialization/defaults (Tone.js) *************************
synth = new Tone.Synth({
  oscillator: {
    type: "triangle",
  },
  envelope: {
    attack: 0.3,
    decay: 0.9,
    sustain: 0.1,
    release: 2,
  },
}).toDestination();
synth.connect(feedbackDelay);
synth.chain(rev);
Tone.Transport.start().bpm.value = timeToBPM(displayTime);

//*************Convert weather description into a sequence of notes ******* */
function grabDescription(data) {
  let current = data.description.toLowerCase();
  const sequences = {
    torrential: ["f3", "e3", "f3", "d3", "a3", "b3"],
    fog: ["d3", ["a#3", "g3"], "d#2", "a#3", "d3"],
    clear: [
      "c4",
      "f4",
      "c3",
      "g4",
      "a#4",
      "c2",
      ["f4", "c4"],
      "g4",
      "e4",
      ["f2", "g3"],
      "g2",
    ],
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
    snow: [
      "c#4",
      "a#3",
      ["c#4", "a#3", "d#3", "f#3"],
      "d#3",
      "f#4",
      "c#3",
      "g#3",
      "f#3",
    ],
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
  const availableDescriptors = Object.keys(sequences);
  let match = availableDescriptors.findIndex((description) =>
    current.includes(description)
  );
  current = availableDescriptors[match];
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
    synth.triggerAttackRelease(note, 0.3, time, 0.2);
    synthB.triggerAttackRelease(note, 0.9, time, 0.3);
  }, grabDescription(data));

  transport.start();
  searchBtn.style.display = "none";
  stopBtn.style.visibility = "visible";

  seq.start();

  // **************temperature conditional logic *********************
  if (data.temp > 45 && data.temp < 60) {
    //moderately average
    synth.chain(dist);
    synth.set({
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.8,
        decay: 1,
        sustain: 0.3,
        release: 2,
      },
    });
  } else if (data.temp > 60 && data.temp < 78) {
    synth.chain(chorus, dist);
    //moderately nice
    synth.set({ detune: +1200 });
    synthB.set({ detune: +1200 });

    synth.set({
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.7,
        decay: 0.3,
        sustain: 0.1,
        release: 1,
      },
    });
  } else if (data.temp > 35 && data.temp < 55) {
    //chilly
    synth.set({
      oscillator: {
        type: "square",
      },
      envelope: {
        attack: 0.4,
        decay: 0.3,
        sustain: 0.2,
        release: 5,
      },
    });
  } else if (data.temp > 89) {
    ///////REALLLYYYY HOT
    synth.chain(rev, shift, pingPong);
    synth.set({
      oscillator: {
        type: "sawtooth",
      },
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
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.7,
        decay: 0.1,
        sustain: 0.3,
        release: 6,
      },
    });
  }
}
//Range Functions

function timeToBPM(time) {
  const hour = parseInt(time.slice(0, 2));
  const bpmMin = 30;
  const bpmMax = 50;
  const timeRange = 23 - 0;
  const bpmRange = bpmMax - bpmMin;

  const bpm = (((hour - 0) * bpmRange) / timeRange + bpmMin).toFixed();
  console.log("bpm:", bpm, "at", time);
  return bpm;
}

// function delayRangeFunction(time) {
//   const hour = parseInt(time.slice(0, 2));
//   const delayRange = 1 - 0.1; //min and max
//   const timeRange = 23 - 0; //reverse min and max
//   const delay = (((hour - 0) * delayRange) / timeRange + 0.1).toFixed(2);
//   console.log("delay time in secs:", delay);
//   return delay;
// }

export { synth, transport };
