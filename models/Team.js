const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    experience: { type: String, required: true },
    study: { type: String, required: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
});

const Team = mongoose.model("Team", TeamSchema);

module.exports = Team;
