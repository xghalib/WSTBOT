const mongoose = require("mongoose");
const user = {
  username: String,
  id: String,
  points: Number,
};

const Points = new mongoose.model("Points", user);
module.exports = Points;
