
import express from "express";
import cors from "cors";
import { storage } from "./storage";
import { insertCourseSchema } from "@shared/schema";
import { z } from "zod";

const app = express();
app.use(express.json());
app.use(cors());

// Serve simple admin interface
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Server - CyberSec Academy</title>
        <style>
            body { 
                background: #000; 
                color: #00ff00; 
                font-family: 'Courier New', monospace; 
                padding: 20px; 
                text-align: center;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                border: 2px solid #00ff00;
                padding: 30px;
                margin-top: 50px;
            }
            h1 { color: #00ff00; }
            a { 
                color: #00ff00; 
                text-decoration: none; 
                border: 1px solid #00ff00;
                padding: 10px 20px;
                display: inline-block;
                margin: 10px;
            }
            a:hover { background: #00ff00; color: #000; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 ADMIN SERVER ACTIVE</h1>
            <p>Admin server is running on port 3001</p>
            <p>API endpoints are available at:</p>
            <ul style="text-align: left;">
                <li>POST /api/admin/login</li>
                <li>GET /api/admin/stats</li>
                <li>GET /api/courses</li>
                <li>POST /api/courses</li>
                <li>DELETE /api/courses/:id</li>
            </ul>
            <hr style="border-color: #00ff00; margin: 30px 0;">
            <p><strong>Access the full admin panel through the main application:</strong></p>
            <a href="https://${req.get('host').replace(':3001', ':5000')}" target="_blank">
                🚀 Open Main Application (Port 5000)
            </a>
            <p style="margin-top: 20px; font-size: 12px;">
                Click the ShieldX icon in the main app to access the admin panel
            </p>
        </div>
    </body>
    </html>
  `);
});

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
