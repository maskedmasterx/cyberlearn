import { users, courses, orders, cartItems, type User, type InsertUser, type Course, type InsertCourse, type Order, type InsertOrder, type CartItem, type InsertCartItem } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Cart operations
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  getCartItems(sessionId: string): Promise<(CartItem & { course: Course })[]>;
  removeFromCart(sessionId: string, courseId: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private orders: Map<number, Order>;
  private cartItems: Map<string, CartItem[]>;
  private currentUserId: number;
  private currentCourseId: number;
  private currentOrderId: number;
  private currentCartItemId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.orders = new Map();
    this.cartItems = new Map();
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentOrderId = 1;
    this.currentCartItemId = 1;
    
    // Initialize with sample courses
    this.initializeSampleCourses();
  }

  private initializeSampleCourses() {
    const sampleCourses = [
      {
        title: "Advanced Penetration Testing",
        description: "Master the fundamentals of ethical hacking, penetration testing, and vulnerability assessment. Learn to think like a black hat to defend like a white hat.",
        price: "24999.00",
        duration: "8 weeks",
        difficulty: "ADVANCED",
        imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        tags: ["penetration-testing", "ethical-hacking", "vulnerability-assessment"],
        features: ["40+ hands-on labs", "Certificate included", "24/7 discord support"],
        isActive: true,
      },
      {
        title: "Malware Development & Analysis",
        description: "Deep dive into advanced penetration testing methodologies, exploit development, and red team operations. Real-world scenarios and live targets.",
        price: "41999.00",
        duration: "12 weeks",
        difficulty: "EXPERT",
        imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        tags: ["malware", "reverse-engineering", "exploit-development"],
        features: ["Live target environments", "Exploit development", "OSCP preparation"],
        isActive: true,
      },
      {
        title: "Digital Forensics & Incident Response",
        description: "Master digital forensics, incident response, and malware analysis. Learn to investigate cyber crimes and recover critical evidence.",
        price: "33999.00",
        duration: "10 weeks",
        difficulty: "EXPERT",
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        tags: ["digital-forensics", "incident-response", "malware-analysis"],
        features: ["Malware analysis lab", "Memory forensics", "Court admissible reports"],
        isActive: true,
      },
      {
        title: "Web Application Hacking",
        description: "Learn to exploit web applications using advanced techniques. Master OWASP Top 10, API security, and authentication bypass methods.",
        price: "29999.00",
        duration: "6 weeks",
        difficulty: "INTERMEDIATE",
        imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        tags: ["web-security", "owasp", "api-security"],
        features: ["OWASP Top 10 Exploitation", "API Security Testing", "Authentication Bypass"],
        isActive: true,
      },
      {
        title: "Wireless Network Exploitation",
        description: "Master wireless security testing, WPA/WPA2 cracking, and radio frequency analysis. Learn to exploit wireless networks professionally.",
        price: "23999.00",
        duration: "5 weeks",
        difficulty: "ADVANCED",
        imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        tags: ["wireless-security", "wifi-hacking", "rf-analysis"],
        features: ["WPA/WPA2 Cracking", "Evil Twin Attacks", "Radio Frequency Analysis"],
        isActive: true,
      },
      {
        title: "Social Engineering Mastery",
        description: "Learn the art of psychological manipulation, OSINT reconnaissance, and physical infiltration techniques used by elite hackers.",
        price: "16999.00",
        duration: "4 weeks",
        difficulty: "BEGINNER",
        imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        tags: ["social-engineering", "osint", "psychological-manipulation"],
        features: ["Psychological Manipulation", "Phishing Campaigns", "OSINT Reconnaissance"],
        isActive: true,
      },
    ];

    sampleCourses.forEach(course => {
      const id = this.currentCourseId++;
      this.courses.set(id, { ...course, id });
    });

    // Create admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "cyb3r@dm1n", // In production, this should be hashed
      email: "admin@cyberacademy.onion",
      isAdmin: true,
    };
    this.users.set(adminUser.id, adminUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      isAdmin: insertUser.isAdmin || null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.isActive);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const course: Course = { 
      ...insertCourse, 
      id,
      imageUrl: insertCourse.imageUrl || null,
      tags: insertCourse.tags || null,
      features: insertCourse.features || null,
      isActive: insertCourse.isActive !== undefined ? insertCourse.isActive : true
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    const updatedCourse = { ...course, ...courseUpdate };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id,
      status: insertOrder.status || null,
      userId: insertOrder.userId || null,
      stripePaymentIntentId: insertOrder.stripePaymentIntentId || null,
      createdAt: new Date().toISOString()
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartItemId++;
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
      addedAt: new Date().toISOString()
    };

    const sessionItems = this.cartItems.get(insertCartItem.sessionId) || [];
    
    // Check if course already in cart
    const existingItem = sessionItems.find(item => item.courseId === insertCartItem.courseId);
    if (existingItem) {
      return existingItem;
    }

    sessionItems.push(cartItem);
    this.cartItems.set(insertCartItem.sessionId, sessionItems);
    return cartItem;
  }

  async getCartItems(sessionId: string): Promise<(CartItem & { course: Course })[]> {
    const sessionItems = this.cartItems.get(sessionId) || [];
    
    return sessionItems.map(item => {
      const course = this.courses.get(item.courseId);
      return { ...item, course: course! };
    }).filter(item => item.course);
  }

  async removeFromCart(sessionId: string, courseId: number): Promise<boolean> {
    const sessionItems = this.cartItems.get(sessionId) || [];
    const filteredItems = sessionItems.filter(item => item.courseId !== courseId);
    
    if (filteredItems.length === sessionItems.length) {
      return false;
    }

    this.cartItems.set(sessionId, filteredItems);
    return true;
  }

  async clearCart(sessionId: string): Promise<boolean> {
    this.cartItems.delete(sessionId);
    return true;
  }
}

export const storage = new MemStorage();
