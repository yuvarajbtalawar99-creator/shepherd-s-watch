import PageWrapper from "@/components/layout/PageWrapper";
import StatCard from "@/components/dashboard/StatCard";
import { mockSheep, mockDailyTasks } from "@/data/mockData";
import { Heart, AlertTriangle, Syringe, Baby, ListChecks, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const healthDist = [
  { name: "Excellent (80+)", value: mockSheep.filter(s => s.health_score >= 80).length, color: "hsl(152,50%,45%)" },
  { name: "Good (60-79)", value: mockSheep.filter(s => s.health_score >= 60 && s.health_score < 80).length, color: "hsl(152,35%,55%)" },
  { name: "Moderate (40-59)", value: mockSheep.filter(s => s.health_score >= 40 && s.health_score < 60).length, color: "hsl(38,80%,55%)" },
  { name: "At Risk (<40)", value: mockSheep.filter(s => s.health_score < 40).length, color: "hsl(4,70%,58%)" },
];

const monthlyVacc = [
  { month: "Sep", completed: 12, due: 15 },
  { month: "Oct", completed: 18, due: 20 },
  { month: "Nov", completed: 14, due: 16 },
  { month: "Dec", completed: 22, due: 22 },
  { month: "Jan", completed: 10, due: 18 },
  { month: "Feb", completed: 5, due: 12 },
];

const illnessTrend = [
  { month: "Sep", cases: 3 },
  { month: "Oct", cases: 5 },
  { month: "Nov", cases: 2 },
  { month: "Dec", cases: 4 },
  { month: "Jan", cases: 1 },
  { month: "Feb", cases: 2 },
];

const Dashboard = () => {
  const totalSheep = mockSheep.length;
  const pregnant = mockSheep.filter(s => s.status === "pregnant").length;
  const highRisk = mockSheep.filter(s => s.risk_level === "high").length;
  const pendingTasks = mockDailyTasks.filter(t => !t.completed).length;

  return (
    <PageWrapper title="Dashboard" subtitle="Welcome back, Farmer! Here's your flock overview.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Sheep" value={totalSheep} icon={ListChecks} color="primary" delay={0} trend={{ value: 8, positive: true }} />
        <StatCard title="Pregnant" value={pregnant} icon={Baby} color="accent" delay={0.1} />
        <StatCard title="High Risk" value={highRisk} icon={AlertTriangle} color="destructive" delay={0.2} subtitle="Needs attention" />
        <StatCard title="Tasks Due" value={pendingTasks} icon={Syringe} color="warning" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" /> Health Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={healthDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {healthDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Syringe className="h-4 w-4 text-accent" /> Vaccination Compliance
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyVacc}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="completed" fill="hsl(152,45%,45%)" radius={[6, 6, 0, 0]} name="Completed" />
              <Bar dataKey="due" fill="hsl(var(--muted))" radius={[6, 6, 0, 0]} name="Due" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-warning" /> Illness Trends
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={illnessTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
            <Line type="monotone" dataKey="cases" stroke="hsl(4,70%,58%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(4,70%,58%)" }} name="Illness Cases" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </PageWrapper>
  );
};

export default Dashboard;
