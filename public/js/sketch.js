import { synth } from "./sequencer.js";
let weatherSubmit = document.querySelector("form");

Pts.namespace(window);

const colors = ["#2d6187", "#f36f62", "#14274e"];

let sound = Sound.from(synth, synth.context).analyze(256);

const space = new CanvasSpace("#synthSketch").setup({
  bgcolor: "#effad3",
  resize: true,
  retina: true,
});
const form = space.getForm();

weatherSubmit.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("hello");
  space.add({
    animate: (time, ftime) => {
      let fd = sound.freqDomainTo([space.size.y, space.size.x / 2]);
      let h = space.size.y / fd.length;

      for (let i = 0, len = fd.length; i < len; i++) {
        let f = fd[i];
        let hz = Math.floor((i * sound.sampleRate) / (sound.binSize * 2)); // bin size is fftSize/2
        let color = colors[i % 3];

        // draw spikes
        form.fillOnly(color).polygon([
          [space.center.x, f.x],
          [space.center.x, f.x + hz],
          [-f.y + space.center.x, f.x + h / 2],
        ]);
        form.fillOnly(color).polygon([
          [space.center.x, f.x],
          [space.center.x, f.x + hz],
          [f.y + space.center.x, f.x + h / 2],
        ]);

        // draw circle
        form
          .fillOnly(color)
          .point(
            [space.center.x - f.y, f.x + hz / 4],
            1000 / 2 + (2 * f.y) / space.size.x,
            "circle"
          );
        form
          .fillOnly(color)
          .point(
            [space.center.x + f.y, f.x + hz / 4],
            1000 / 2 + (2 * f.y) / space.size.x,
            "circle"
          );
      }
    },
  });

  space.play();
});

// space.bindMouse().bindTouch().play();
