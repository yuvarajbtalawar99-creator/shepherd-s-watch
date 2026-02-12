import PageWrapper from "@/components/layout/PageWrapper";
import { mockSheep } from "@/data/mockData";
import { motion } from "framer-motion";
import HealthScoreGauge from "@/components/sheep/HealthScoreGauge";
import { Heart, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const females = mockSheep.filter(s => s.gender === "female" && s.status !== "pregnant");
const males = mockSheep.filter(s => s.gender === "male");

const recommendations = females.map(f => {
  const bestMale = males.reduce((best, m) => m.health_score > best.health_score ? m : best, males[0]);
  const score = Math.round((f.health_score + (bestMale?.health_score ?? 0)) / 2);
  const reasons: string[] = [];
  if (f.health_score >= 70) reasons.push("Strong maternal health score");
  if (bestMale && bestMale.health_score >= 80) reasons.push(`${bestMale.name} has excellent genetics`);
  if (f.status === "healthy") reasons.push("Currently in healthy condition");
  if (reasons.length === 0) reasons.push("General breeding candidate");

  return {
    female: f,
    male: bestMale,
    compatibility: score,
    reasons,
  };
}).sort((a, b) => b.compatibility - a.compatibility);

const BreedingIntelligence = () => {
  return (
    <PageWrapper title="Breeding Intelligence" subtitle="AI-recommended breeding pairs based on health, genetics & history">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.female.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                    <span className="text-xl">🐑</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{rec.female.name}</p>
                  <p className="text-[10px] text-muted-foreground">♀ {rec.female.breed}</p>
                </div>
                <Heart className="h-5 w-5 text-primary mx-2" />
                {rec.male && (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-1">
                      <span className="text-xl">🐏</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">{rec.male.name}</p>
                    <p className="text-[10px] text-muted-foreground">♂ {rec.male.breed}</p>
                  </div>
                )}
              </div>
              <HealthScoreGauge score={rec.compatibility} size={72} />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Info className="h-3 w-3" /> Why this match
              </p>
              {rec.reasons.map((r, j) => (
                <div key={j} className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{r}</p>
                </div>
              ))}
            </div>

            <Badge variant="outline" className="mt-3 bg-primary/5 text-primary border-primary/20">
              Compatibility: {rec.compatibility}%
            </Badge>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
};

export default BreedingIntelligence;
