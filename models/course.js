const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: String,
  prerequisites: [String],
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: String,
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  liveSessions: [
    {
      title: String,
      dateTime: Date,
      instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }
  ]
});

module.exports = mongoose.model("Course", courseSchema);
