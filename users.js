const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  id: String,
  isLoggedIn: String, // 0 if logged off
  total: Number,
  lastlogin: String,
  history: Array, // [{type:'in',at:16050934},{type:'out', at:16050970, time:360000}]
});

const Logins = mongoose.model("logins", postSchema);
module.exports = Logins;
