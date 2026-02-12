import { useParams, Link } from "react-router-dom";
import PageWrapper from "@/components/layout/PageWrapper";
import HealthScoreGauge from "@/components/sheep/HealthScoreGauge";
import HealthTimeline from "@/components/sheep/HealthTimeline";
import { mockSheep, mockHealthEvents } from "@/data/mockData";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, Shield, Calendar, Weight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/20" },
  sick: { label: "Sick", className: "bg-destructive/10 text-destructive border-destructive/20" },
  pregnant: { label: "Pregnant", className: "bg-primary/10 text-primary border-primary/20" },
  lactating: { label: "Lactating", className: "bg-accent/10 text-accent border-accent/20" },
};

const riskExplanation = {
  low: "All health metrics are within normal range. Keep up the good care!",
  medium: "Some indicators need attention. Check vaccination schedule and recent health events.",
  high: "Immediate attention required. Multiple health factors are concerning.",
};

const SheepProfile = () => {
  const { id } = useParams();
  const sheep = mockSheep.find(s => s.id === id);
  const events = mockHealthEvents.filter(e => e.sheep_id === id);

  if (!sheep) {
    return (
      <PageWrapper title="Sheep Not Found" subtitle="This sheep ID does not exist.">
        <Link to="/sheep" className="text-primary underline">← Back to Registry</Link>
      </PageWrapper>
    );
  }

  const age = new Date().getFullYear() - new Date(sheep.date_of_birth).getFullYear();
  const statusCfg = statusConfig[sheep.status];

  return (
    <PageWrapper
      title=""
      actions={
        <Link to="/sheep">
          <Button variant="ghost" className="gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐑</span>
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">{sheep.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{sheep.tag_id}</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
            </div>

            <div className="my-6">
              <HealthScoreGauge score={sheep.health_score} size={160} label="Health Credit Score" />
            </div>

            {/* Risk Level */}
            <div className={`rounded-xl p-3 text-left ${
              sheep.risk_level === "high" ? "bg-destructive/10" : sheep.risk_level === "medium" ? "bg-warning/10" : "bg-success/10"
            }`}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{
                color: sheep.risk_level === "high" ? "hsl(4,70%,58%)" : sheep.risk_level === "medium" ? "hsl(38,80%,55%)" : "hsl(152,50%,45%)"
              }}>
                {sheep.risk_level.toUpperCase()} RISK
              </p>
              <p className="text-xs text-foreground/80">{riskExplanation[sheep.risk_level]}</p>
            </div>

            {/* Details */}
            <div className="mt-5 space-y-3 text-left">
              {[
                { icon: Tag, label: "Breed", value: sheep.breed },
                { icon: Calendar, label: "Age", value: `${age} years` },
                { icon: Weight, label: "Weight", value: `${sheep.weight_kg} kg` },
                { icon: Shield, label: "Gender", value: sheep.gender === "female" ? "Female ♀" : "Male ♂" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-5 gap-2 rounded-xl">
              <QrCode className="h-4 w-4" /> View QR Code
            </Button>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="glass-card p-6">
            <h3 className="section-title mb-5">Digital DNA — Health Passport</h3>
            {events.length > 0 ? (
              <HealthTimeline events={events} />
            ) : (
              <p className="text-muted-foreground text-sm">No health events recorded yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default SheepProfile;
