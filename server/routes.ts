import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCourseSchema, insertCartItemSchema } from "@shared/schema";
import { z } from "zod";

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

  

  // Generate PhonePe payment details
  app.post("/api/generate-payment", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Get cart items
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.course.price), 0);
      
      // Generate order ID
      const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Create pending order
      const order = await storage.createOrder({
        userId: null,
        courseIds: cartItems.map(item => item.courseId),
        totalAmount: totalAmount.toString(),
        stripePaymentIntentId: orderId, // Using this field for order ID
        status: "pending_payment"
      });

      res.json({ 
        orderId,
        totalAmount: totalAmount.toFixed(2),
        courses: cartItems.map(item => ({
          title: item.course.title,
          price: item.course.price
        })),
        qrCodeUrl: "/assets/qr-code.jpg"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error generating payment: " + error.message });
    }
  });

  // Verify UTR and complete order
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { orderId, utrNumber, sessionId } = req.body;
      
      if (!orderId || !utrNumber || !sessionId) {
        return res.status(400).json({ message: "Order ID, UTR number, and Session ID are required" });
      }

      // Update order status to pending verification
      const orders = Array.from((storage as any).orders.values());
      const order = orders.find((o: any) => o.stripePaymentIntentId === orderId) as any;
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await storage.updateOrderStatus(order.id, "pending_verification");

      // Get cart items for WhatsApp message
      const cartItems = await storage.getCartItems(sessionId);
      const courseNames = cartItems.map(item => item.course.title).join(', ');
      
      // Generate WhatsApp message
      const whatsappMessage = encodeURIComponent(
        `🔐 CYBER ACADEMY - Payment Verification\n\n` +
        `Order ID: ${orderId}\n` +
        `UTR: ${utrNumber}\n` +
        `Courses: ${courseNames}\n` +
        `Amount: ₹${order.totalAmount}\n\n` +
        `Please verify this payment and provide course access.`
      );
      
      const whatsappUrl = `https://wa.me/918000000000?text=${whatsappMessage}`;

      res.json({ 
        message: "Payment submitted for verification", 
        whatsappUrl,
        orderId
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error verifying payment: " + error.message });
    }
  });

  

  const httpServer = createServer(app);
  return httpServer;
}
