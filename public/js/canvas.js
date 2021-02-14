import { synth, fft, audioAnalyser, audioCtx } from "./sequencer";

let canvas = document.getElementById("#canvas");
let ctx = canvas.getContext("2d");
let analyser = audioAnalyser;

analyser.size = 2048;

console.log(analyser);
