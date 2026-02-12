import { motion } from "framer-motion";
import { Sheep } from "@/types/sheep";
import HealthScoreGauge from "./HealthScoreGauge";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface SheepCardProps {
  sheep: Sheep;
  index: number;
}

const statusConfig: Record<Sheep["status"], { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/20" },
  sick: { label: "Sick", className: "bg-destructive/10 text-destructive border-destructive/20" },
  pregnant: { label: "Pregnant", className: "bg-primary/10 text-primary border-primary/20" },
  lactating: { label: "Lactating", className: "bg-accent/10 text-accent border-accent/20" },
};

const riskConfig: Record<Sheep["risk_level"], string> = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

const SheepCard = ({ sheep, index }: SheepCardProps) => {
  const statusCfg = statusConfig[sheep.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/sheep/${sheep.id}`} className="block">
        <div className="glass-card p-5 hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
          <div className="flex items-center gap-4">
            <HealthScoreGauge score={sheep.health_score} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-bold text-foreground">{sheep.name}</h3>
                <span className="text-xs text-muted-foreground font-mono">{sheep.tag_id}</span>
              </div>
              <p className="text-sm text-muted-foreground">{sheep.breed} · {sheep.gender === "female" ? "♀" : "♂"} · {sheep.weight_kg}kg</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
                <Badge variant="outline" className={riskConfig[sheep.risk_level]}>Risk: {sheep.risk_level}</Badge>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default SheepCard;
