const request = require("postman-request");

const forescat = (lat, long, callback) => {
  const url = `http://api.weatherstack.com/current?access_key=${process.env.WEATHER_API}&query=${lat},${long}&units=f`;

  request({ url, json: true }, (error, { body }) => {
    if (error) {
      //could leave 2nd arg blank, which is equilievnt to undefinded
      callback("unable to connect to weather services", undefined);
    } else if (body.error) {
      callback("unable to access location", undefined);
    } else {
      callback(undefined, {
        location: body.location.name,
        temp: body.current.temperature,
        feelsLike: body.current.feelslike,
        description: body.current.weather_descriptions[0],
        precip: body.current.precip,
        humidity: body.current.humidity,
      });
    }
  });
};

module.exports = forescat;
