const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema({
  participant:String,
  level: { type: Number, default: 1 },
  coins: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },  // Stores the current streak count
  lastAttemptDate: { type: Date, default: null },  // Stores the last quiz attempt date
});

module.exports = mongoose.model("Participant", ParticipantSchema);
