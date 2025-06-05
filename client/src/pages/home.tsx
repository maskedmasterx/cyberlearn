import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/course-card";
import CartModal from "@/components/cart-modal";
import AdminPanel from "@/components/admin-panel";
import MatrixRain from "@/components/matrix-rain";
import TerminalStats from "@/components/terminal-stats";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, Terminal, ShieldX, Menu, X } from "lucide-react";
import type { Course } from "@shared/schema";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartItems } = useCart();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  useEffect(() => {
    document.title = "CyberSec Academy - Elite Cybersecurity Training";
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 relative overflow-x-hidden">
      <MatrixRain />
      
      {/* Header */}
      <header className="relative z-10 border-b border-green-500 bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <Terminal className="text-green-500 text-2xl" />
              <h1 className="text-2xl font-bold glitch-text" data-text="CYBER_ACADEMY">
                CYBER_ACADEMY
              </h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('courses')} 
                className="hover:text-green-400 transition-colors"
              >
                ~/courses
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className="hover:text-green-400 transition-colors"
              >
                ~/features
              </button>
              <button 
                onClick={() => scrollToSection('stats')} 
                className="hover:text-green-400 transition-colors"
              >
                ~/stats
              </button>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartOpen(true)}
                  className="relative hover:text-green-400 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-black rounded-full w-5 h-5 text-xs flex items-center justify-center cart-pulse">
                      {cartItems.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black border-b border-green-500 relative z-10">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <button 
              onClick={() => scrollToSection('courses')} 
              className="block hover:text-green-400 transition-colors"
            >
              ~/courses
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="block hover:text-green-400 transition-colors"
            >
              ~/features
            </button>
            <button 
              onClick={() => scrollToSection('stats')} 
              className="block hover:text-green-400 transition-colors"
            >
              ~/stats
            </button>
            <div className="flex items-center space-x-4 pt-4 border-t border-green-500">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="hover:text-green-400 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Cart ({cartItems.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 py-12 md:py-20 matrix-bg">
        <div className="container mx-auto px-4 text-center">
          <div className="relative z-10">
            <Card className="terminal-border p-4 md:p-8 max-w-4xl mx-auto bg-black/80">
              <pre className="text-left text-xs md:text-sm mb-4 md:mb-6 text-green-400 overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────┐
│  > ACCESSING ELITE CYBERSECURITY TRAINING PLATFORM...      │
│  > CONNECTION ESTABLISHED                                   │
│  > WELCOME TO THE MATRIX                                    │
└─────────────────────────────────────────────────────────────┘`}
              </pre>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 glitch-text" data-text="HACK THE FUTURE">
                HACK THE FUTURE
              </h2>
              
              <div className="text-sm sm:text-base md:text-xl mb-6 md:mb-8 font-mono space-y-1 md:space-y-0">
                <div>{'>'} Master elite cybersecurity skills</div>
                <div>{'>'} Learn from real-world hackers</div>
                <div>{'>'} Become the security expert companies need</div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                <Button 
                  onClick={() => scrollToSection('courses')}
                  className="w-full sm:w-auto bg-green-500 text-black px-6 md:px-8 py-3 font-bold hover:bg-green-400 transition-all transform hover:scale-105 neon-glow text-sm md:text-base"
                >
                  <Terminal className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  START_HACKING.exe
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto border-green-500 text-green-500 px-6 md:px-8 py-3 font-bold hover:bg-green-500 hover:text-black transition-all text-sm md:text-base"
                >
                  WATCH_DEMO.mp4
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Terminal Stats */}
      <TerminalStats />

      {/* Featured Courses */}
      <section id="courses" className="relative z-10 py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <pre className="text-green-400 text-sm mb-4">
{`┌─[ COURSE_CATALOG.db ]─────────────────────────────────────┐
│ SELECT * FROM elite_courses WHERE skill_level = 'LETHAL' │
└───────────────────────────────────────────────────────────┘`}
            </pre>
            <h2 className="text-4xl font-bold mb-4 glitch-text" data-text="ELITE TRAINING MODULES">
              ELITE TRAINING MODULES
            </h2>
            <p className="text-green-400">Choose your weapon. Master your craft.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="terminal-border bg-gray-900 p-6 animate-pulse">
                  <div className="h-40 bg-gray-800 mb-4"></div>
                  <div className="h-4 bg-gray-800 mb-2"></div>
                  <div className="h-20 bg-gray-800 mb-4"></div>
                  <div className="h-8 bg-gray-800"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              variant="outline"
              className="border-green-500 text-green-500 px-8 py-3 font-bold hover:bg-green-500 hover:text-black transition-all"
            >
              <Terminal className="w-5 h-5 mr-2" />
              LOAD_MORE_COURSES.sh
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-12 md:py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <pre className="text-green-400 text-xs md:text-sm mb-4 overflow-x-auto">
{`┌─[ PLATFORM_FEATURES.json ]───────────────────────────────┐
│ "why_choose_us": "elite_training_experience"            │
└──────────────────────────────────────────────────────────┘`}
            </pre>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-green-500">WHY_CHOOSE_CYBERACADEMY.exe</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: "🛡️",
                title: "REAL-WORLD LABS",
                description: "Practice on actual vulnerable systems used by enterprises. No simulations, no fake scenarios."
              },
              {
                icon: "🕵️",
                title: "ELITE INSTRUCTORS", 
                description: "Learn from active penetration testers and security researchers with real-world experience."
              },
              {
                icon: "🎓",
                title: "INDUSTRY CERTS",
                description: "Prepare for CEH, OSCP, CISSP and other high-value cybersecurity certifications."
              },
              {
                icon: "⏰",
                title: "24/7 ACCESS",
                description: "Access labs and resources anytime. The darkness never sleeps, neither should your learning."
              },
              {
                icon: "👥",
                title: "ELITE COMMUNITY",
                description: "Join an exclusive network of elite hackers and security professionals worldwide."
              },
              {
                icon: "💼",
                title: "JOB PLACEMENT",
                description: "90% of our graduates land high-paying cybersecurity jobs within 6 months."
              }
            ].map((feature, index) => (
              <Card key={index} className="terminal-border p-6 bg-black text-center hover:bg-gray-900 transition-colors">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-green-500">{feature.title}</h3>
                <p className="text-green-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-12 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <pre className="text-green-400 text-xs md:text-sm mb-4 overflow-x-auto">
{`┌─[ TESTIMONIALS.log ]─────────────────────────────────────┐
│ grep "success_stories" /var/log/student_feedback.txt    │
└──────────────────────────────────────────────────────────┘`}
            </pre>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-green-500">ELITE_TESTIMONIALS.txt</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Card className="terminal-border p-6 bg-gray-900">
              <pre className="text-green-400 text-sm mb-4">
{`> FROM: ghost_h4cker@protonmail.com
> SUBJECT: Life Changed Forever`}
              </pre>
              <p className="mb-4 text-green-500">"CyberAcademy transformed me from a script kiddie to a certified penetration tester. Now I'm making $120k/year at a Fortune 500 company."</p>
              <div className="text-gray-400">
                <strong>- Alex "GhostHack" Rodriguez</strong><br />
                Senior Penetration Tester, Microsoft
              </div>
            </Card>
            
            <Card className="terminal-border p-6 bg-gray-900">
              <pre className="text-green-400 text-sm mb-4">
{`> FROM: cyber_queen@tutanota.com
> SUBJECT: From Zero to Hero`}
              </pre>
              <p className="mb-4 text-green-500">"Started with zero knowledge, now I run my own cybersecurity consultancy. The advanced courses here are unmatched anywhere else."</p>
              <div className="text-gray-400">
                <strong>- Sarah "CyberQueen" Chen</strong><br />
                CEO, Quantum Security Solutions
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-green-500 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Terminal className="text-green-500 text-xl" />
                <h3 className="text-xl font-bold text-green-500">CYBER_ACADEMY</h3>
              </div>
              <pre className="text-green-400 text-sm">
{`> Elite cybersecurity training
> Real-world hacking labs  
> Professional certifications
> 24/7 darkweb access`}
              </pre>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-green-500 mb-4">COURSES</h4>
              <ul className="space-y-2 text-green-400">
                <li><a href="#" className="hover:text-green-500 transition-colors">Penetration Testing</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Malware Analysis</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Digital Forensics</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Web App Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-green-500 mb-4">RESOURCES</h4>
              <ul className="space-y-2 text-green-400">
                <li><a href="#" className="hover:text-green-500 transition-colors">Hacking Labs</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Certification Prep</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Community Forum</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Job Board</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-green-500 mb-4">CONTACT</h4>
              <div className="space-y-2 text-green-400">
                <div>📧 admin@cyberacademy.onion</div>
                <div>🛡️ Secure Encrypted Channel</div>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-green-400 hover:text-green-500 transition-colors text-xl">💬</a>
                  <a href="#" className="text-green-400 hover:text-green-500 transition-colors text-xl">📱</a>
                  <a href="#" className="text-green-400 hover:text-green-500 transition-colors text-xl">💻</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-green-500 mt-8 pt-8 text-center">
            <pre className="text-green-400 text-sm">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│ © 2024 CYBER_ACADEMY.onion | All rights reserved | Encrypted & Anonymous   │
│ "In the darkness of cyberspace, knowledge is the only light"               │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}
