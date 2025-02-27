const express = require("express");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Participant = require("../models/Participant");
const router = express.Router();

//show all quizzes
router.get("/get/all/streak/quiz", async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    quizzes.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.render("student/allQuiz.ejs", { quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//todays quiz

router.get("/get/today/streak/quiz", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const quiz = await Quiz.findOne({ date: today });
    if (!quiz) {
      res.send("no quiz for today");
    }
    res.redirect(`/attempt/new/streak/quiz/${quiz._id}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a Quiz
router.get("/create/new/quiz", async (req, res) => {
  try {
    res.render("admin/createQuiz.ejs");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a Quiz
router.post("/create/new/streak/quiz", async (req, res) => {
  try {
    const { question, option1, option2, option3, option4, answer, category } =
      req.body;
    const newQuiz = new Quiz({
      question,
      option1,
      option2,
      option3,
      option4,
      answer,
    });
    await newQuiz.save();
    res.status(201).json({ message: "Quiz created successfully" });
  } catch (err) {
    console.log(erroe);
  }
});

// attempt quiz
router.get("/attempt/new/streak/quiz/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    const attempt = await QuizAttempt.findOne({
      userId: req.user.id,
      quizId: id,
    });
    if (attempt) {
      res.render("errors/alreadyAttempted.ejs", { quiz });
    } else {
      res.render("student/attemptQuiz.ejs", { quiz });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/submit/new/streak/quiz/:quizId", async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from request
    const { quizId } = req.params;
    const { selected } = req.body;
    const quiz = await Quiz.findById(quizId);
    var isCorrect = 0;
    if (selected === quiz.answer) {
      isCorrect = 1;
    }
    const Attempt = new QuizAttempt({
      userId,
      quizId,
      isCorrect,
    });
    await Attempt.save();
    let participant = await Participant.findOne({ participant: userId });
    if (!participant) {
      participant = new Participant({ participant: userId });
    }
    const today = new Date().toISOString().split("T")[0];
    const lastAttemptDate = participant.lastAttemptDate
      ? new Date(participant.lastAttemptDate).toISOString().split("T")[0]
      : null;
    // Check streak logic
    if (lastAttemptDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toISOString().split("T")[0];
      if (lastAttemptDate === yesterdayFormatted) {
        participant.streak += 1; // Continue streak
      } else if (lastAttemptDate !== today) {
        participant.streak = 1; // Reset streak
      }
    } else {
      participant.streak = 1; // First attempt starts streak
    }
    // Increase level or coins on correct answers
    if (selected === quiz.answer) {
      participant.coins += 10;
      participant.level += 1;
    }
    participant.lastAttemptDate = today;
    await participant.save();
    res.json({
      message: "Quiz attempt recorded",
      streak: participant.streak,
      level: participant.level,
      coins: participant.coins,
    });
  } catch (error) {
    console.log(error);
  }
});

// Handle quiz submission
router.post("/submit-quiz", async (req, res) => {
  try {
    const { userId } = req.session; // Get user from session
    const { selectedAnswer, quizId } = req.body;

    const quiz = await Quiz.findById(quizId);
    const user = await User.findById(userId);

    if (!quiz || !user) {
      return res.status(404).json({ message: "Quiz or User not found" });
    }

    // Check if the answer is correct
    const isCorrect = selectedAnswer === quiz.answer;

    // Check streak logic
    const today = new Date();
    const lastAttemptDate = user.lastAttemptDate
      ? new Date(user.lastAttemptDate)
      : null;

    if (lastAttemptDate) {
      const timeDiff = today - lastAttemptDate;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff < 1) {
        // Already attempted today, no streak update
        return res.json({
          isCorrect,
          message: "You've already attempted a quiz today!",
        });
      } else if (daysDiff >= 1 && daysDiff < 2) {
        // Within 24 hours, increase streak
        user.streak += 1;
      } else {
        // More than 24 hours gap, reset streak
        user.streak = 1;
      }
    } else {
      // First attempt, start streak
      user.streak = 1;
    }

    user.lastAttemptDate = today;
    await user.save();

    res.json({
      isCorrect,
      streak: user.streak,
      message: isCorrect ? "Correct! Streak Updated" : "Wrong Answer!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
