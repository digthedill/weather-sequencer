const path = require("path");
const express = require("express");
const hbs = require("hbs");

const geocode = require("./utils/geocode");
const forecast = require("./utils/forecast");

const app = express();

//Define paths for express config
const publicDirPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "./templates/views");
const partialsPath = path.join(__dirname, "./templates/partials");

app.set("view engine", "hbs");
app.set("views", viewsPath);

hbs.registerPartials(partialsPath);

app.use(express.static(publicDirPath));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/weather", (req, res) => {
  console.log(req.query);
  if (!req.query.address) {
    return res.send({
      error: "You must provide a REAL address!",
    });
  }
  const address = req.query.address;
  geocode(address, (error, { latitude, longitude, location } = {}) => {
    if (!address)
      return res.send({
        error: "Please provide a location",
      });
    if (error) return res.send({ error });
    forecast(latitude, longitude, (error, forecastData) => {
      if (error) return res.send({ error });
      res.send({ ...forecastData, location });
    });
  });
});
//404 page setup (must be last)
app.get("*", (req, res) => {
  res.send("404 - PAGE NOT FOUND");
});

app.listen(process.env.PORT, () => {
  console.log("server running on " + process.env.PORT);
});
