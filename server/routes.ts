import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertCourseSchema, insertCartItemSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching courses: " + error.message });
    }
  });

  // Get single course
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching course: " + error.message });
    }
  });

  // Create new course (admin only)
  app.post("/api/courses", async (req, res) => {
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

  // Update course (admin only)
  app.put("/api/courses/:id", async (req, res) => {
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

  // Delete course (admin only)
  app.delete("/api/courses/:id", async (req, res) => {
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

  // Cart operations
  app.post("/api/cart", async (req, res) => {
    try {
      const { sessionId, courseId } = req.body;
      
      if (!sessionId || !courseId) {
        return res.status(400).json({ message: "Session ID and Course ID are required" });
      }

      const cartItem = await storage.addToCart({ sessionId, courseId });
      res.status(201).json(cartItem);
    } catch (error: any) {
      res.status(500).json({ message: "Error adding to cart: " + error.message });
    }
  });

  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching cart: " + error.message });
    }
  });

  app.delete("/api/cart/:sessionId/:courseId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const courseId = parseInt(req.params.courseId);
      
      const removed = await storage.removeFromCart(sessionId, courseId);
      
      if (!removed) {
        return res.status(404).json({ message: "Item not found in cart" });
      }
      
      res.json({ message: "Item removed from cart" });
    } catch (error: any) {
      res.status(500).json({ message: "Error removing from cart: " + error.message });
    }
  });

  app.delete("/api/cart/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      await storage.clearCart(sessionId);
      res.json({ message: "Cart cleared" });
    } catch (error: any) {
      res.status(500).json({ message: "Error clearing cart: " + error.message });
    }
  });

  // Admin authentication
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

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, sessionId } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: "usd",
        metadata: {
          sessionId: sessionId || 'anonymous'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Complete order after successful payment
  app.post("/api/complete-order", async (req, res) => {
    try {
      const { sessionId, paymentIntentId } = req.body;
      
      if (!sessionId || !paymentIntentId) {
        return res.status(400).json({ message: "Session ID and Payment Intent ID are required" });
      }

      // Get cart items
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.course.price), 0);
      
      // Create order
      const order = await storage.createOrder({
        userId: null, // Anonymous for now
        courseIds: cartItems.map(item => item.courseId),
        totalAmount: totalAmount.toString(),
        stripePaymentIntentId: paymentIntentId,
        status: "completed"
      });

      // Clear cart
      await storage.clearCart(sessionId);

      res.json({ 
        message: "Order completed successfully", 
        order,
        courses: cartItems.map(item => item.course)
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error completing order: " + error.message });
    }
  });

  // Get system stats for admin
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      
      res.json({
        totalCourses: courses.length,
        activeStudents: 1337, // Mock data for demo
        monthlyRevenue: "$45,670", // Mock data for demo
        uptime: "99.9%"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching stats: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
