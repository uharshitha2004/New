const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: String,
  description: String,
});

module.exports = mongoose.model("Module", ModuleSchema);
