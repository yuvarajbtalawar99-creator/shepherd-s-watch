import { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { supabase } from "@/lib/supabase";
import { Sheep } from "@/types/sheep";
import { motion } from "framer-motion";
import HealthScoreGauge from "@/components/sheep/HealthScoreGauge";
import { Heart, CheckCircle, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/contexts/LanguageContext";

interface BreedingRecommendation {
  female: Sheep;
  male: Sheep | null;
  compatibility: number;
  reasons: string[];
}

const BreedingIntelligence = () => {
  const { t } = useTranslation();
  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sheep data
  const fetchSheep = async () => {
    const { data, error } = await supabase
      .from("sheep")
      .select("*");

    if (error) {
      console.error("Error fetching sheep:", error);
    } else {
      setSheep(data || []);
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    const loadSheep = async () => {
      setLoading(true);
      await fetchSheep();
      setLoading(false);
    };

    loadSheep();

    // Set up real-time subscription
    const subscription = supabase
      .channel('breeding-sheep-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sheep' },
        () => {
          console.log('Sheep data changed, refreshing breeding recommendations...');
          fetchSheep();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Calculate breeding recommendations from real data
  const females = sheep.filter(s => s.gender === "female" && s.status !== "pregnant");
  const males = sheep.filter(s => s.gender === "male");

  const recommendations: BreedingRecommendation[] = females.map(f => {
    const bestMale = males.length > 0
      ? males.reduce((best, m) => m.health_score > best.health_score ? m : best, males[0])
      : null;

    const score = bestMale
      ? Math.round((f.health_score + bestMale.health_score) / 2)
      : f.health_score;

    const reasons: string[] = [];
    if (f.health_score >= 70) reasons.push("Strong maternal health score");
    if (bestMale && bestMale.health_score >= 80) reasons.push(`${bestMale.name} has excellent genetics`);
    if (f.status === "healthy") reasons.push("Currently in healthy condition");
    if (f.risk_level === "low") reasons.push("Low risk profile");
    if (reasons.length === 0) reasons.push("General breeding candidate");

    return {
      female: f,
      male: bestMale,
      compatibility: score,
      reasons,
    };
  }).sort((a, b) => b.compatibility - a.compatibility);

  if (loading) {
    return (
      <PageWrapper title={t('breedingIntelligenceTitle')} subtitle={t('loadingBreeding')}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  if (recommendations.length === 0) {
    return (
      <PageWrapper title={t('breedingIntelligenceTitle')} subtitle={t('breedingSubtitle')}>
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 text-primary/40" />
          <p className="font-medium">{t('noBreedingAvailable')}</p>
          <p className="text-sm">{t('addFemaleSheep')}</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={t('breedingIntelligenceTitle')} subtitle={t('breedingSubtitle')}>
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
                {rec.male ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-1">
                      <span className="text-xl">🐏</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">{rec.male.name}</p>
                    <p className="text-[10px] text-muted-foreground">♂ {rec.male.breed}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-1">
                      <span className="text-xl">❓</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">{t('noMaleAvailable')}</p>
                  </div>
                )}
              </div>
              <HealthScoreGauge score={rec.compatibility} size={72} />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Info className="h-3 w-3" /> {t('whyThisMatch')}
              </p>
              {rec.reasons.map((r, j) => (
                <div key={j} className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{r}</p>
                </div>
              ))}
            </div>

            <Badge variant="outline" className="mt-3 bg-primary/5 text-primary border-primary/20">
              {t('compatibility')}: {rec.compatibility}%
            </Badge>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
};

export default BreedingIntelligence;
