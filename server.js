const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
require("dotenv").config();

const User = require("./models/User"); // Import User model
const course = require("./models/course");
const Module = require("./models/Module");
const Lesson = require("./models/Lesson");
const Quiz = require("./models/Quiz");
const Assignment = require("./models/Assignment");
const Discussion = require("./models/Discussion");
const Transaction = require("./models/Transaction");
const Notification = require("./models/Notification");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ strict: false, limit: "10mb" }));

// Function to validate email format
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Function to validate password strength
const validatePassword = (password) => /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Default route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
//User Routes
// Module 1 Register Route
app.post("/api/users/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character.",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role: "Student" });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error registering user:", error); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Module 1 Login Route
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate the email format using the regex function
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email });
    console.log(user); // Log user details to verify
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password entered:", password);  // Log entered password
    console.log("Stored hash:", user.password);  // Log the stored hash in the database
    console.log("Password comparison result:", isMatch);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Profile Route
app.get("/api/users/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error("Error getting profile:", error); // Log the error
    res.status(401).json({ message: "Invalid or expired token", error: error.message });
  }
});

// Update Profile Route
app.put("/api/users/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updatedUser = await User.findByIdAndUpdate(decoded.id, { $set: req.body }, { new: true });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete Profile Route
app.delete("/api/users/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndDelete(decoded.id);
    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create Course Route
app.post("/api/courses", async (req, res) => {
  try {
    const { title, description, duration, prerequisites, instructor, category } = req.body;

    const newCourse = new Course({
      title,
      description,
      duration,
      prerequisites,
      instructor,
      category,
    });

    await newCourse.save();
    res.status(201).json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    console.error("Error creating course:", error); // Log the error
    res.status(500).json({ message: "Error creating course", error: error.message });
  }
});

// Update Course Route
app.put("/api/courses/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;
    const updatedCourse = await Course.findByIdAndUpdate(courseId, updates, { new: true });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error); // Log the error
    res.status(500).json({ message: "Error updating course", error: error.message });
  }
});

// Assign Instructor Route
app.put("/api/courses/:courseId/assign-instructor", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { instructorId } = req.body;

    const course = await Course.findByIdAndUpdate(courseId, { instructor: instructorId }, { new: true });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Instructor assigned successfully", course });
  } catch (error) {
    console.error("Error assigning instructor:", error); // Log the error
    res.status(500).json({ message: "Error assigning instructor", error: error.message });
  }
});

// Fetch Courses by Category Route
app.get("/api/courses/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const courses = await Course.find({ category });

    if (courses.length === 0) {
      return res.status(404).json({ message: "No courses found for this category" });
    }

    res.status(200).json({ courses });
  } catch (error) {
    console.error("Error fetching courses by category:", error); // Log the error
    res.status(500).json({ message: "Error fetching courses by category", error: error.message });
  }
});

// Enroll in Course Route
app.post("/api/courses/:courseId/enroll", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if prerequisites are met
    const user = await User.findById(userId).populate('completedCourses');
    const unmetPrerequisites = course.prerequisites.filter(prereq => !user.completedCourses.includes(prereq));

    if (unmetPrerequisites.length > 0) {
      return res.status(400).json({ message: "Prerequisites not met", unmetPrerequisites });
    }

    // Enroll user
    user.enrolledCourses.push(courseId);
    await user.save();

    res.status(200).json({ message: "Enrolled successfully" });
  } catch (error) {
    console.error("Error enrolling in course:", error); // Log the error
    res.status(500).json({ message: "Error enrolling in course", error: error.message });
  }
});
//Module 3 Lecture Uploads
app.post("/api/courses/:courseId/modules/:moduleId/lessons", upload.single("file"), async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, contentType } = req.body;
    const fileData = req.file.buffer.toString("base64");

    const newLesson = new Lesson({
      course: courseId,
      module: moduleId,
      title,
      contentType,
      fileData,
    });

    await newLesson.save();
    res.status(201).json({ message: "Lesson uploaded successfully", lesson: newLesson });
  } catch (error) {
    res.status(500).json({ message: "Error uploading lesson", error: error.message });
  }
});
//Module 3 Quiz
app.post("/api/courses/:courseId/quizzes", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, questions } = req.body;

    const newQuiz = new Quiz({ course: courseId, title, questions });
    await newQuiz.save();

    res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (error) {
    res.status(500).json({ message: "Error creating quiz", error: error.message });
  }
});

//Module 3 Assignments
app.post("/api/courses/:courseId/assignments", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, dueDate } = req.body;

    const newAssignment = new Assignment({ course: courseId, title, description, dueDate });
    await newAssignment.save();

    res.status(201).json({ message: "Assignment created successfully", assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ message: "Error creating assignment", error: error.message });
  }
});

//Module 3 Module Organization
app.post("/api/courses/:courseId/modules", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    const newModule = new Module({ course: courseId, title, description });
    await newModule.save();

    res.status(201).json({ message: "Module added successfully", module: newModule });
  } catch (error) {
    res.status(500).json({ message: "Error adding module", error: error.message });
  }
});

//Module 3 Discussion
app.post("/api/courses/:courseId/discussions", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, comment } = req.body;

    const newDiscussion = new Discussion({ course: courseId, user: userId, comment });
    await newDiscussion.save();

    res.status(201).json({ message: "Discussion posted successfully", discussion: newDiscussion });
  } catch (error) {
    res.status(500).json({ message: "Error posting discussion", error: error.message });
  }
});

// Module 3 Live Sessions
app.post("/api/courses/:courseId/live-sessions", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, dateTime, instructor } = req.body;

    const newLiveSession = {
      title,
      dateTime,
      instructor,
    };

    await Course.findByIdAndUpdate(courseId, { $push: { liveSessions: newLiveSession } });

    res.status(201).json({ message: "Live session scheduled successfully", liveSession: newLiveSession });
  } catch (error) {
    res.status(500).json({ message: "Error scheduling live session", error: error.message });
  }
});

app.get("/api/admin/user-activity", async (req, res) => {
  try {
    const users = await User.find().populate("enrolledCourses");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user activity", error: err });
  }
});

// Enrollment & Drop-out Rates
app.get("/api/admin/enrollment-dropout", async (req, res) => {
  try {
    const courses = await Course.find();
    const stats = courses.map(course => ({
      courseId: course._id,
      title: course.title,
      enrolledStudents: course.enrolledStudents.length, // Assuming this field exists
      dropoutRate: course.enrolledStudents.length / course.totalStudents // Example formula
    }));
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching enrollment data", error: err });
  }
});

// Revenue Reports (example)
app.get("/api/admin/revenue-reports", async (req, res) => {
  try {
    // Example: You may store revenue data separately in a transaction model.
    const revenueData = await Transaction.find();  // Assuming Transaction model exists for financials
    res.status(200).json(revenueData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching revenue data", error: err });
  }
});

// Performance Insights
app.get("/api/admin/performance-insights", async (req, res) => {
  try {
    const performance = await User.aggregate([
      { $match: { role: "Student" } },
      { $lookup: { from: "courses", localField: "enrolledCourses", foreignField: "_id", as: "courses" } },
      { $unwind: "$courses" },
      { $group: { _id: "$courses.title", averageEngagement: { $avg: "$courses.engagementLevel" } } }
    ]);
    res.status(200).json(performance);
  } catch (err) {
    res.status(500).json({ message: "Error fetching performance data", error: err });
  }
});

// System-wide Notifications (example)
app.post("/api/admin/send-notification", async (req, res) => {
  try {
    const { title, message } = req.body;

    // Here you might store notifications in a model or broadcast them
    // For now, just returning the message
    res.status(200).json({ message: `Notification sent: ${title}`, notification: { title, message } });
  } catch (err) {
    res.status(500).json({ message: "Error sending notification", error: err });
  }
});
// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
