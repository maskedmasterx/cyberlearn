import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { insertCourseSchema } from "@shared/schema";
import { z } from "zod";
import cors from "cors";

const app = express();

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cybersecurityhub.onrender.com'] 
    : ['http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};
app.use(cors(corsOptions));

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    if (path.startsWith("/api") && body) {
      logLine += ` :: ${JSON.stringify(body).slice(0, 100)}${body.length > 100 ? '...' : ''}`;
    }
    
    log(logLine);
    return originalJson.call(this, body);
  };
  
  next();
});

// ======================
// ADMIN ROUTES
// ======================

// Admin Authentication Middleware
const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Admin Panel HTML
app.get("/admin", (req, res) => {
  res.send(/* Your full admin HTML template */);
});

// Admin Login Endpoint
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
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

// Admin Stats
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

// Admin Course Management
app.get("/api/admin/courses", authenticateAdmin, async (req, res) => {
  try {
    const courses = await storage.getAllCourses();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching courses: " + error.message });
  }
});

app.post("/api/admin/courses", authenticateAdmin, async (req, res) => {
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

app.delete("/api/admin/courses/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCourse(id);
    res.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting course: " + error.message });
  }
});

// ======================
// PUBLIC API ROUTES
// ======================

// Public Courses Endpoint (only active courses)
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await storage.getAllCourses();
    const activeCourses = courses.filter(course => course.isActive);
    res.json(activeCourses);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching courses: " + error.message });
  }
});

// Initialize Server
(async () => {
  try {
    // Register additional routes
    await registerRoutes(app);
    
    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Create a single HTTP server instance for both development and production
    const server = await registerRoutes(app);
    
    // Set longer timeouts to prevent connection reset errors
    server.keepAliveTimeout = 120000; // 120 seconds
    server.headersTimeout = 120000; // 120 seconds
    
    // Vite in development, static files in production
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Bind to 0.0.0.0 to work with Render and use process.env.PORT
    const port = process.env.PORT || 5000;
    const host = '0.0.0.0';
    server.listen(Number(port), host, () => {
      log(`Server running in ${process.env.NODE_ENV} mode on ${host}:${port}`);
    });
    
    app.listen(process.env.PORT || 5000, () => log(`Production server running on port ${process.env.PORT || 5000}`));
  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();