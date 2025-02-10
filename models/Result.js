const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
    name: { type: String, required: true },
    exam: { type: String, required: true },
    year: { type: String, required: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
});

const Result = mongoose.model("Result", ResultSchema);

module.exports = Result;
