import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Download, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import type { Course } from '@shared/schema';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const isInCart = cartItems.some(item => item.courseId === course.id);

  const handleAddToCart = async () => {
    if (isInCart) return;

    try {
      await addToCart(course.id);
      setIsAdded(true);
      
      toast({
        title: "COURSE_ADDED.exe",
        description: `${course.title} has been added to your arsenal.`,
      });

      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      toast({
        title: "ERROR.exe",
        description: "Failed to add course to cart",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case 'BEGINNER': return 'bg-green-600';
      case 'INTERMEDIATE': return 'bg-yellow-600';
      case 'ADVANCED': return 'bg-orange-600';
      case 'EXPERT': return 'bg-red-600';
      case 'LETHAL': return 'bg-red-500';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card className="terminal-border bg-gray-900 p-6 hover:bg-gray-800 transition-all transform hover:scale-105 course-card">
      <div className="relative mb-4 h-48 terminal-border overflow-hidden">
        <img 
          src={course.imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"} 
          alt={course.title}
          className="w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Terminal className="text-4xl text-green-500" />
        </div>
      </div>
      
      <div className="mb-4 flex gap-2">
        <Badge className={`${getDifficultyColor(course.difficulty)} text-black font-bold`}>
          {course.difficulty}
        </Badge>
        {course.tags?.slice(0, 2).map(tag => (
          <Badge key={tag} variant="outline" className="border-green-500 text-green-400">
            {tag}
          </Badge>
        ))}
      </div>
      
      <h3 className="text-xl font-bold mb-2 text-green-500">{course.title}</h3>
      
      <div className="terminal-border bg-black p-3 mb-4 text-sm">
        <div className="text-green-400 mb-2">$ cat course_description.txt</div>
        <p className="text-gray-300">{course.description}</p>
      </div>
      
      {course.features && (
        <div className="space-y-2 mb-6 text-sm">
          {course.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center">
              <span className="text-green-500 mr-2">{'>'}</span>
              <span className="text-green-400">{feature}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl font-bold text-green-500">${course.price}</span>
        <span className="text-gray-400">{course.duration}</span>
      </div>
      
      <Button
        onClick={handleAddToCart}
        disabled={isInCart}
        className={`w-full py-3 font-bold transition-all ${
          isInCart 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : isAdded
            ? 'bg-green-600 text-black'
            : 'bg-green-500 text-black hover:bg-green-400'
        }`}
      >
        {isInCart ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            IN_CART.status
          </>
        ) : isAdded ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            ADDED_TO_CART.exe
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            ACQUIRE_COURSE.exe
          </>
        )}
      </Button>
    </Card>
  );
}
