const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
  title: String,
  contentType: String,
  fileData: String, // Stores Base64 data
});

module.exports = mongoose.model("Lesson", LessonSchema);
