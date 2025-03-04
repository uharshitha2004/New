const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: String,
  questions: [{ question: String, options: [String], answer: String }],
});

module.exports = mongoose.model("Quiz", QuizSchema);
