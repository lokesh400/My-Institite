const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
});

const Exam = mongoose.model("Exam", ExamSchema);

module.exports = Exam;
