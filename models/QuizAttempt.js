const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema({
  userId:String,
  quizId:String,
  isCorrect:String,
  date: { type: String, default: new Date().toISOString().split("T")[0] },
});

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
