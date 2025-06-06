import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { insertCourseSchema } from "@shared/schema";
import { z } from "zod";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Improved CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cybersecurityhub.onrender.com'] 
    : ['http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};
app.use(cors(corsOptions));

// Middleware for logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
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

// Admin routes
app.get("/admin", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>CyberSec Academy - Admin Panel</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                background: #000; 
                color: #00ff00; 
                font-family: 'Courier New', monospace; 
                min-height: 100vh;
                overflow-x: hidden;
            }
            .matrix-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.1;
                z-index: -1;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                position: relative;
                z-index: 1;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border: 2px solid #00ff00;
                padding: 20px;
                background: rgba(0, 255, 0, 0.05);
            }
            .login-section {
                max-width: 500px;
                margin: 0 auto;
                padding: 30px;
                border: 2px solid #00ff00;
                background: rgba(0, 0, 0, 0.8);
                margin-bottom: 30px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                color: #00ff00;
                font-weight: bold;
            }
            input {
                width: 100%;
                padding: 12px;
                background: #000;
                border: 1px solid #00ff00;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 14px;
            }
            input:focus {
                outline: none;
                border-color: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
            }
            .btn {
                background: #00ff00;
                color: #000;
                border: none;
                padding: 12px 30px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                width: 100%;
                font-size: 16px;
            }
            .btn:hover {
                background: #00cc00;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
            .admin-panel {
                display: none;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 30px;
            }
            .panel-section {
                border: 2px solid #00ff00;
                padding: 20px;
                background: rgba(0, 0, 0, 0.8);
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            .stat-card {
                padding: 15px;
                border: 1px solid #00ff00;
                text-align: center;
                background: rgba(0, 255, 0, 0.05);
            }
            .course-item {
                border: 1px solid #00ff00;
                padding: 10px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(0, 255, 0, 0.03);
            }
            .delete-btn {
                background: #ff0000;
                color: #fff;
                border: none;
                padding: 5px 15px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            }
            .success { color: #00ff00; }
            .error { color: #ff0000; }
            .hidden { display: none; }
            h1, h2, h3 { color: #00ff00; margin-bottom: 15px; }
            @media (max-width: 768px) {
                .admin-panel { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 CYBERSEC ACADEMY - ADMIN PANEL</h1>
                <p>Secure Administrative Interface</p>
            </div>

            <div class="login-section" id="loginSection">
                <h2>AUTHENTICATION REQUIRED</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label>USERNAME:</label>
                        <input type="text" id="username" placeholder="admin" required>
                    </div>
                    <div class="form-group">
                        <label>PASSWORD:</label>
                        <input type="password" id="password" placeholder="cyb3r@dm1n" required>
                    </div>
                    <button type="submit" class="btn">AUTHENTICATE</button>
                    <div id="loginMessage" style="margin-top: 15px; text-align: center;"></div>
                </form>
            </div>

            <div class="admin-panel" id="adminPanel">
                <div class="panel-section">
                    <h3>SYSTEM STATISTICS</h3>
                    <div class="stats-grid" id="statsGrid">
                        <div class="stat-card">
                            <div style="font-size: 24px; font-weight: bold;" id="totalCourses">0</div>
                            <div style="font-size: 12px;">TOTAL COURSES</div>
                        </div>
                        <div class="stat-card">
                            <div style="font-size: 24px; font-weight: bold;" id="activeStudents">0</div>
                            <div style="font-size: 12px;">ACTIVE STUDENTS</div>
                        </div>
                        <div class="stat-card">
                            <div style="font-size: 24px; font-weight: bold;" id="monthlyRevenue">₹0</div>
                            <div style="font-size: 12px;">MONTHLY REVENUE</div>
                        </div>
                        <div class="stat-card">
                            <div style="font-size: 24px; font-weight: bold;" id="uptime">0%</div>
                            <div style="font-size: 12px;">SYSTEM UPTIME</div>
                        </div>
                    </div>
                </div>

                <div class="panel-section">
                    <h3>COURSE MANAGEMENT</h3>
                    <div id="coursesList"></div>
                    <button class="btn" onclick="showAddCourseForm()" style="margin-top: 15px;">ADD NEW COURSE</button>
                </div>
            </div>
        </div>

        <script>
            let authData = null;

            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const messageDiv = document.getElementById('loginMessage');

                try {
                    const response = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        authData = { username, password };
                        messageDiv.innerHTML = '<div class="success">✓ ACCESS GRANTED</div>';
                        
                        setTimeout(() => {
                            document.getElementById('loginSection').style.display = 'none';
                            document.getElementById('adminPanel').style.display = 'grid';
                            loadDashboard();
                        }, 1000);
                    } else {
                        messageDiv.innerHTML = '<div class="error">✗ ACCESS DENIED</div>';
                    }
                } catch (error) {
                    messageDiv.innerHTML = '<div class="error">✗ CONNECTION ERROR</div>';
                }
            });

            async function loadDashboard() {
                if (!authData) return;

                try {
                    // Load stats
                    const statsResponse = await fetch('/api/admin/stats', {
                        headers: {
                            'username': authData.username,
                            'password': authData.password
                        }
                    });
                    
                    if (statsResponse.ok) {
                        const stats = await statsResponse.json();
                        document.getElementById('totalCourses').textContent = stats.totalCourses;
                        document.getElementById('activeStudents').textContent = stats.activeStudents;
                        document.getElementById('monthlyRevenue').textContent = stats.monthlyRevenue;
                        document.getElementById('uptime').textContent = stats.uptime;
                    }

                    // Load courses
                    const coursesResponse = await fetch('/api/admin/courses', {
                        headers: {
                            'username': authData.username,
                            'password': authData.password
                        }
                    });
                    
                    if (coursesResponse.ok) {
                        const courses = await coursesResponse.json();
                        displayCourses(courses);
                    }
                } catch (error) {
                    console.error('Error loading dashboard:', error);
                }
            }

            function displayCourses(courses) {
                const coursesList = document.getElementById('coursesList');
                coursesList.innerHTML = courses.map(course => `
                    <div class="course-item">
                        <div style="flex: 1">
                            <div style="font-weight: bold;">${course.title}</div>
                            <div style="font-size: 12px;">${course.difficulty} • $${course.price}</div>
                        </div>
                        <button class="delete-btn" onclick="deleteCourse(${course.id})">DELETE</button>
                    </div>
                `).join('');
            }

            async function deleteCourse(courseId) {
                if (!confirm('Are you sure you want to delete this course?')) return;

                try {
                    const response = await fetch(`/api/admin/courses/${courseId}`, {
                        method: 'DELETE',
                        headers: {
                            'username': authData.username,
                            'password': authData.password
                        }
                    });

                    if (response.ok) {
                        loadDashboard(); // Reload the dashboard
                    }
                } catch (error) {
                    console.error('Error deleting course:', error);
                }
            }

            function showAddCourseForm() {
                alert('Course addition form will be implemented in the full interface. Use the main application for now.');
            }
        </script>
    </body>
    </html>
  `);
});

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

// Admin API routes
app.get("/api/courses", async (req, res, next) => {
  // Check if this is an admin request
  const { username, password } = req.headers;
  if (username && password) {
    // This is an admin request, handle with admin middleware
    return authenticateAdmin(req, res, async () => {
      try {
        // Admin get all courses
        app.get("/api/admin/courses", authenticateAdmin, async (req, res) => {
          try {
            const courses = await storage.getAllCourses();
            res.json(courses);
          } catch (error: any) {
            res.status(500).json({ message: "Error fetching courses: " + error.message });
          }
        });
      } catch (error: any) {
        res.status(500).json({ message: "Error fetching courses: " + error.message });
      }
    });
  }
  
  // Regular user request, pass to next middleware
  next();
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

// Admin course deletion endpoint
app.delete("/api/admin/courses/:id", authenticateAdmin, async (req, res) => {
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

// Set up main application routes
(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    log(`Combined server running on port ${port}`);
  });
})();