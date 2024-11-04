const mongoose = require("mongoose");
const tahdeer = {
  id: Number,
  channel: String,
  title: String,
  members: Array,
  top: Array,
  deleted: Boolean,
  msg: String,
  role: String,
  log: String,
  guild: String,
};

const Tahdeer = new mongoose.model("Tahdeer", tahdeer);
module.exports = Tahdeer;
