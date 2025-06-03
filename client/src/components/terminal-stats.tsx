import { Card } from '@/components/ui/card';

export default function TerminalStats() {
  const stats = [
    { value: "1337+", label: "Elite Hackers Trained" },
    { value: "50+", label: "Advanced Courses" },
    { value: "24/7", label: "Darkweb Labs Access" },
    { value: "99.9%", label: "Success Rate" }
  ];

  return (
    <section id="stats" className="relative z-10 py-12 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="terminal-border p-6 text-center bg-black">
              <div className="text-3xl font-bold text-green-500 mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
