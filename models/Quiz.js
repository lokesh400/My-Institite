const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  option1: { type: String, required: true },
  option2: { type: String, required: true },
  option3: { type: String, required: true },
  option4: { type: String, required: true },
  answer: { type: String, required: true },  // Store the correct answer (e.g., "option1")
  category: { type: String },
  date: { type: String, default: new Date().toISOString().split("T")[0] },
});

module.exports = mongoose.model("Quiz", QuizSchema);
