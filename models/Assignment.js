const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: String,
  description: String,
  dueDate: Date,
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
