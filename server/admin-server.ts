
import express from "express";
import cors from "cors";
import { storage } from "./storage";
import { insertCourseSchema } from "@shared/schema";
import { z } from "zod";

const app = express();
app.use(express.json());
app.use(cors());

// Admin authentication middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  const { username, password } = req.headers;
  
  if (!username || !password) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await storage.getUserByUsername(username as string);
    if (!user || user.password !== password || !user.isAdmin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication error" });
  }
};

// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password || !user.isAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ 
      message: "Authentication successful", 
      user: { id: user.id, username: user.username, isAdmin: user.isAdmin }
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error during authentication: " + error.message });
  }
});

// Get admin stats
app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const courses = await storage.getAllCourses();
    
    res.json({
      totalCourses: courses.length,
      activeStudents: 1337,
      monthlyRevenue: "₹45,670",
      uptime: "99.9%"
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching stats: " + error.message });
  }
});

// Get all courses for admin
app.get("/api/courses", authenticateAdmin, async (req, res) => {
  try {
    const courses = await storage.getAllCourses();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching courses: " + error.message });
  }
});

// Create new course
app.post("/api/courses", authenticateAdmin, async (req, res) => {
  try {
    const courseData = insertCourseSchema.parse(req.body);
    const course = await storage.createCourse(courseData);
    res.status(201).json(course);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid course data", errors: error.errors });
    }
    res.status(500).json({ message: "Error creating course: " + error.message });
  }
});

// Update course
app.put("/api/courses/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courseData = insertCourseSchema.partial().parse(req.body);
    const course = await storage.updateCourse(id, courseData);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json(course);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid course data", errors: error.errors });
    }
    res.status(500).json({ message: "Error updating course: " + error.message });
  }
});

// Delete course
app.delete("/api/courses/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCourse(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting course: " + error.message });
  }
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Admin server running on port ${PORT}`);
});

export default app;
