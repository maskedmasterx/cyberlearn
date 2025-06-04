import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ShieldX, Key, Plus, BarChart3, Users, DollarSign, Clock } from 'lucide-react';
import type { Course } from '@shared/schema';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    difficulty: '',
    imageUrl: '',
    features: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: () => fetch('http://localhost:3001/api/admin/stats', {
      headers: { 
        'username': username,
        'password': password
      }
    }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    queryFn: () => fetch('http://localhost:3001/api/courses', {
      headers: { 
        'username': username,
        'password': password
      }
    }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      }).then(res => res.json()),
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "ACCESS_GRANTED.exe",
        description: "Welcome to the admin control panel.",
      });
    },
    onError: () => {
      toast({
        title: "ACCESS_DENIED.exe",
        description: "Invalid credentials. Try: admin / cyb3r@dm1n",
        variant: "destructive",
      });
    },
  });

  const addCourseMutation = useMutation({
    mutationFn: (courseData: any) => apiRequest('POST', '/api/courses', courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setNewCourse({
        title: '',
        description: '',
        price: '',
        duration: '',
        difficulty: '',
        imageUrl: '',
        features: ''
      });
      toast({
        title: "COURSE_DEPLOYED.exe",
        description: "New course has been added to the catalog.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "DEPLOYMENT_FAILED.exe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: (courseId: number) => apiRequest('DELETE', `/api/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "COURSE_TERMINATED.exe",
        description: "Course has been removed from the catalog.",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    const courseData = {
      ...newCourse,
      price: parseFloat(newCourse.price).toFixed(2),
      features: newCourse.features.split(',').map(f => f.trim()).filter(f => f),
      tags: [],
      isActive: true
    };

    addCourseMutation.mutate(courseData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-green-500 text-green-500 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-500 flex items-center">
            <ShieldX className="w-6 h-6 mr-2" />
            ADMIN_CONTROL_PANEL.exe
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-6">
            <pre className="text-green-400 text-sm">
{`┌─[ AUTHENTICATION_REQUIRED ]──────────────────────────────┐
│ Enter admin credentials to access control panel         │
└──────────────────────────────────────────────────────────┘`}
            </pre>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="username@root"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="terminal-input"
                  required
                />
                <Input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="terminal-input"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="bg-green-500 text-black font-bold hover:bg-green-400 transition-colors"
              >
                <Key className="w-4 h-4 mr-2" />
                {loginMutation.isPending ? 'AUTHENTICATING...' : 'AUTHENTICATE.exe'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="terminal-border p-4 bg-gray-900 text-center">
                <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-500">{stats?.totalCourses || 0}</div>
                <div className="text-sm text-green-400">COURSES_DEPLOYED</div>
              </Card>
              
              <Card className="terminal-border p-4 bg-gray-900 text-center">
                <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-500">{stats?.activeStudents || 0}</div>
                <div className="text-sm text-green-400">ACTIVE_STUDENTS</div>
              </Card>
              
              <Card className="terminal-border p-4 bg-gray-900 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-500">{stats?.monthlyRevenue || '$0'}</div>
                <div className="text-sm text-green-400">MONTHLY_REVENUE</div>
              </Card>
              
              <Card className="terminal-border p-4 bg-gray-900 text-center">
                <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-500">{stats?.uptime || '0%'}</div>
                <div className="text-sm text-green-400">SYSTEM_UPTIME</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Add Course Form */}
              <Card className="terminal-border p-6 bg-gray-900">
                <h3 className="text-xl font-bold text-green-500 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  DEPLOY_NEW_COURSE
                </h3>
                
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <Input
                    placeholder="Course Title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="terminal-input"
                    required
                  />
                  
                  <Textarea
                    placeholder="Course Description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="terminal-input h-20"
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price ($)"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                      className="terminal-input"
                      required
                    />
                    
                    <Input
                      placeholder="Duration (e.g., 8 weeks)"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                      className="terminal-input"
                      required
                    />
                  </div>
                  
                  <Select 
                    value={newCourse.difficulty} 
                    onValueChange={(value) => setNewCourse({...newCourse, difficulty: value})}
                  >
                    <SelectTrigger className="terminal-input">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-500">
                      <SelectItem value="BEGINNER">BEGINNER</SelectItem>
                      <SelectItem value="INTERMEDIATE">INTERMEDIATE</SelectItem>
                      <SelectItem value="ADVANCED">ADVANCED</SelectItem>
                      <SelectItem value="EXPERT">EXPERT</SelectItem>
                      <SelectItem value="LETHAL">LETHAL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="Image URL (optional)"
                    value={newCourse.imageUrl}
                    onChange={(e) => setNewCourse({...newCourse, imageUrl: e.target.value})}
                    className="terminal-input"
                  />
                  
                  <Textarea
                    placeholder="Features (comma-separated)"
                    value={newCourse.features}
                    onChange={(e) => setNewCourse({...newCourse, features: e.target.value})}
                    className="terminal-input h-16"
                  />
                  
                  <Button
                    type="submit"
                    disabled={addCourseMutation.isPending}
                    className="w-full bg-green-500 text-black font-bold hover:bg-green-400 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addCourseMutation.isPending ? 'DEPLOYING...' : 'DEPLOY_COURSE.exe'}
                  </Button>
                </form>
              </Card>

              {/* Course Management */}
              <Card className="terminal-border p-6 bg-gray-900">
                <h3 className="text-xl font-bold text-green-500 mb-4">
                  COURSE_MANAGEMENT
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {courses.map((course) => (
                    <div key={course.id} className="terminal-border p-3 bg-black flex justify-between items-center">
                      <div>
                        <div className="font-bold text-green-500 text-sm">{course.title}</div>
                        <div className="text-xs text-green-400">{course.difficulty} • ${course.price}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCourse.mutate(course.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        DELETE
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
