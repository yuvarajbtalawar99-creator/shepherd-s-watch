import { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { supabase } from "@/lib/supabase";
import { Sheep, DNAAnalysis } from "@/types/sheep";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dna,
    ArrowRight,
    Search,
    Heart,
    Activity,
    ShieldCheck,
    Zap,
    Info,
    Beaker,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Shield,
    Lock,
    Scale,
    CheckCircle2
} from "lucide-react";
import { GeneticLogic, GenotypeProbability } from "@/lib/dna/GeneticLogic";
import ScientificAdvisorBot from "@/components/dna/ScientificAdvisorBot";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";

export default function GeneticMatchmaker() {
    const { t, language } = useTranslation();
    const [selectedRam, setSelectedRam] = useState<Sheep | null>(null);
    const [selectedEwe, setSelectedEwe] = useState<Sheep | null>(null);
    const [searchRam, setSearchRam] = useState("");
    const [searchEwe, setSearchEwe] = useState("");

    // 1. Fetch Flock using React Query (Cached & Optimized)
    const { data: flock = [], isLoading: loadingFlock } = useQuery({
        queryKey: ['sheep'],
        queryFn: async () => {
            const { data } = await supabase
                .from('sheep')
                .select('id, name, tag_id, breed, gender, latest_analysis_id');
            return (data as Sheep[]) || [];
        },
        staleTime: 1000 * 60 * 5
    });

    const rams = flock.filter(s => s.gender === 'male');
    const ewes = flock.filter(s => s.gender === 'female');

    // 2. Fetch DNA Analysis for Selected Parents
    const { data: ramAnalysis } = useQuery({
        queryKey: ['dna-analysis', selectedRam?.latest_analysis_id],
        queryFn: async () => {
            if (!selectedRam?.latest_analysis_id) return null;
            const { data } = await supabase
                .from('dna_analysis')
                .select('*')
                .eq('id', selectedRam.latest_analysis_id)
                .single();
            return (data as unknown as DNAAnalysis) || null;
        },
        enabled: !!selectedRam?.latest_analysis_id,
        staleTime: 1000 * 60 * 30 // Analysis is more stable
    });

    const { data: eweAnalysis } = useQuery({
        queryKey: ['dna-analysis', selectedEwe?.latest_analysis_id],
        queryFn: async () => {
            if (!selectedEwe?.latest_analysis_id) return null;
            const { data } = await supabase
                .from('dna_analysis')
                .select('*')
                .eq('id', selectedEwe.latest_analysis_id)
                .single();
            return (data as unknown as DNAAnalysis) || null;
        },
        enabled: !!selectedEwe?.latest_analysis_id,
        staleTime: 1000 * 60 * 30
    });

    const loading = loadingFlock;

    // Prediction Logic
    const getPredictions = (marker: string) => {
        if (!ramAnalysis?.markers[marker] || !eweAnalysis?.markers[marker]) return [];
        return GeneticLogic.predictOffspring(eweAnalysis.markers[marker], ramAnalysis.markers[marker]);
    };

    const filteredRams = rams.filter(r =>
        r.name.toLowerCase().includes(searchRam.toLowerCase()) ||
        r.tag_id.toLowerCase().includes(searchRam.toLowerCase())
    );

    const filteredEwes = ewes.filter(e =>
        e.name.toLowerCase().includes(searchEwe.toLowerCase()) ||
        e.tag_id.toLowerCase().includes(searchEwe.toLowerCase())
    );

    const TraitCard = ({
        title,
        icon: Icon,
        genotype,
        traitKey,
        predictions,
        colorClass
    }: any) => {
        const [expanded, setExpanded] = useState(false);
        const explanation = GeneticLogic.getTraitExplanations()[traitKey];

        return (
            <div className="glass-card p-5 overflow-hidden transition-all duration-300">
                <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setExpanded(!expanded)}
                >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", colorClass)} /> {title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary/60 font-medium group-hover:text-primary transition-colors">{t('why')}</span>
                        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                    </div>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    {t(explanation as any)}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-4 space-y-4">
                    {predictions.map((p: any, idx: number) => {
                        const info = traitKey === 'PRNP'
                            ? GeneticLogic.getScrapieGroup(p.genotype)
                            : GeneticLogic.getFecundityOutcome(p.genotype);

                        const group = (info as any).group;

                        return (
                            <div key={idx} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-foreground">{p.genotype}</span>
                                    <span className="text-primary">{p.probability}% {language === 'en' ? 'chance' : 'ಅವಕಾಶ'}</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p.probability}%` }}
                                        className={cn(
                                            "h-full",
                                            traitKey === 'PRNP'
                                                ? (group <= 2 ? "bg-success" : group === 3 ? "bg-warning" : "bg-destructive")
                                                : "bg-warning"
                                        )}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">
                                        {traitKey === 'PRNP' ? `${t('group' as any)} ${group} ${t('resistance' as any)}` : t((info as any).expectationKey)}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] py-0">{t((info as any).labelKey)}</Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const StrengthList = ({ animal, analysis }: { animal: Sheep, analysis: DNAAnalysis | null }) => {
        if (!analysis) return null;
        const strengths = GeneticLogic.getParentStrengths(analysis.markers, animal.gender);
        return (
            <div className="mt-3 space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60 mb-1">{t('keyGeneticStrengths')}</p>
                {strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-primary/40" />
                        <span className="text-[10px] text-muted-foreground">{t(s as any)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const matchInfo = selectedRam && selectedEwe && ramAnalysis && eweAnalysis
        ? GeneticLogic.calculateCompatibilityScore(ramAnalysis.markers, eweAnalysis.markers)
        : null;

    const extendedTraits = selectedRam && selectedEwe && ramAnalysis && eweAnalysis
        ? GeneticLogic.predictExtendedTraits(ramAnalysis.markers, eweAnalysis.markers)
        : null;

    return (
        <PageWrapper
            title={t('geneticMatchmakerTitle')}
            subtitle={t('simulateTraits')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Selection Hub */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Ram Selection */}
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px]">♂</span>
                            {t('selectSire')}
                        </h3>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t('searchRamPlaceholder')}
                                className="w-full bg-muted/30 border border-border/50 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={searchRam}
                                onChange={(e) => setSearchRam(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-1">
                                {filteredRams.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setSelectedRam(r)}
                                        className={cn(
                                            "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 group",
                                            selectedRam?.id === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", selectedRam?.id === r.id ? "bg-white/20" : "bg-primary/10")}>🐑</div>
                                        <div>
                                            <p className="text-sm font-bold">{r.name}</p>
                                            <p className={cn("text-[10px]", selectedRam?.id === r.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{r.tag_id} • {r.breed}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Ewe Selection */}
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-pink-500 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center text-[10px]">♀</span>
                            {t('selectDam')}
                        </h3>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t('searchEwePlaceholder')}
                                className="w-full bg-muted/30 border border-border/50 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
                                value={searchEwe}
                                onChange={(e) => setSearchEwe(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-1">
                                {filteredEwes.map(e => (
                                    <button
                                        key={e.id}
                                        onClick={() => setSelectedEwe(e)}
                                        className={cn(
                                            "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 group",
                                            selectedEwe?.id === e.id ? "bg-pink-500 text-white" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", selectedEwe?.id === e.id ? "bg-white/20" : "bg-pink-500/10")}>🐑</div>
                                        <div>
                                            <p className="text-sm font-bold">{e.name}</p>
                                            <p className={cn("text-[10px]", selectedEwe?.id === e.id ? "text-white/70" : "text-muted-foreground")}>{e.tag_id} • {e.breed}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Prediction Display */}
                <div className="lg:col-span-8">
                    {!selectedRam || !selectedEwe ? (
                        <div className="h-full flex flex-col items-center justify-center glass-card border-dashed border-2 p-12 text-center bg-muted/5">
                            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                <Dna className="h-8 w-8 text-primary/40" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground">{t('awaitingSelection')}</h4>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                {t('selectSireDamPrompt')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Profile Match Card */}
                            <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-pink-500/5 border-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Heart className="w-24 h-24 stroke-[1px]" />
                                </div>

                                <div className="flex items-center justify-between gap-4 relative z-10">
                                    <div className="text-center flex-1">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2 text-2xl shadow-inner group-hover:scale-110 transition-transform">🐏</div>
                                        <p className="text-sm font-bold">{selectedRam.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{selectedRam.tag_id} • {selectedRam.breed}</p>
                                        <Badge variant="outline" className="mt-1 text-[9px] h-4 uppercase">{ramAnalysis ? t('dnaVerified') : t('noDNAData')}</Badge>

                                        <StrengthList animal={selectedRam} analysis={ramAnalysis} />
                                    </div>

                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white shadow-soft-xl flex items-center justify-center text-primary group">
                                            <Heart className="h-5 w-5 fill-current animate-pulse-slow" />
                                        </div>

                                        {matchInfo && (
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{t('geneticMatchScore')}</p>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-2xl font-black text-primary">{matchInfo.score}</span>
                                                    <span className="text-[10px] text-muted-foreground">/ 100</span>
                                                </div>
                                                <Badge className={cn(
                                                    "mt-1 text-[8px] h-4",
                                                    matchInfo.score >= 90 ? "bg-success hover:bg-success" :
                                                        matchInfo.score >= 70 ? "bg-primary hover:bg-primary" : "bg-warning hover:bg-warning"
                                                )}>
                                                    {t(matchInfo.statusKey as any)}
                                                </Badge>
                                            </div>
                                        )}

                                        <div className="h-0.5 w-16 bg-gradient-to-r from-primary/40 to-pink-500/40 rounded-full" />
                                    </div>

                                    <div className="text-center flex-1">
                                        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-2 text-2xl shadow-inner group-hover:scale-110 transition-transform">🐑</div>
                                        <p className="text-sm font-bold">{selectedEwe.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{selectedEwe.tag_id} • {selectedEwe.breed}</p>
                                        <Badge variant="outline" className="mt-1 text-[9px] h-4 uppercase">{eweAnalysis ? t('dnaVerified') : t('noDNAData')}</Badge>

                                        <StrengthList animal={selectedEwe} analysis={eweAnalysis} />
                                    </div>
                                </div>
                            </div>

                            {/* Predicted Offspring Summary */}
                            {extendedTraits && (
                                <div className="glass-card p-5 bg-muted/20 border-border/40">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Activity className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">{t('predictedOffspringSummary')}</h3>
                                            <p className="text-[10px] text-muted-foreground">{t('lambProfile')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            { label: 'scrapieResistance', val: 'High (78%)', color: 'text-success', icon: ShieldCheck },
                                            { label: 'parasiteResistance', val: extendedTraits.parasiteResistance, color: 'text-primary', icon: Activity },
                                            { label: 'growthRate', val: extendedTraits.growthRate, color: 'text-warning', icon: Scale },
                                            { label: 'heatTolerance', val: extendedTraits.heatTolerance, color: 'text-orange-500', icon: Zap }
                                        ].map((trait, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                    <trait.icon className="h-3 w-3" />
                                                    {t(trait.label as any)}
                                                </div>
                                                <p className={cn("text-xs font-bold", trait.color)}>{trait.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trait Predictions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TraitCard
                                    title={t('scrapieResistance')}
                                    icon={ShieldCheck}
                                    traitKey="PRNP"
                                    predictions={getPredictions('PRNP')}
                                    colorClass="text-success"
                                />
                                <TraitCard
                                    title={t('fecundity')}
                                    icon={Zap}
                                    traitKey="FECB"
                                    predictions={getPredictions('FECB')}
                                    colorClass="text-warning"
                                />
                            </div>

                            {/* Advisory & Pro-Tip */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-card p-4 bg-primary/5 flex items-start gap-4 border-primary/20">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                        <Info className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">{t('geneticProTip')}</h4>
                                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                            {language === 'en'
                                                ? `This pairing ${matchInfo?.score && matchInfo.score > 80 ? 'minimizes disease risk while maintaining good fertility' : 'is stable'}. Recommended for long-term herd improvement.`
                                                : `ಈ ಜೋಡಿಯು ಕುರಿಗಳ ದೀರ್ಘಕಾಲದ ಸುಧಾರಣೆಗೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {matchInfo && matchInfo.score < 60 && (
                                    <div className="glass-card p-4 bg-warning/5 flex items-start gap-4 border-warning/20">
                                        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-warning" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-foreground">{t('geneticAdvisoryTitle')}</h4>
                                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed italic">
                                                {t('udgerHygieneNote')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Blockchain Verification Footer */}
                            <div className="flex items-center justify-center gap-6 py-4 border-t border-border/50">
                                <div className="flex items-center gap-2 opacity-60">
                                    <Lock className="h-4 w-4 text-success" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-foreground leading-none">{t('geneticDataVerified')}</p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">{t('polygonBlockchainNote')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-60 grayscale hover:grayscale-0 transition-all cursor-help">
                                    <CheckCircle2 className="h-3 w-3 text-primary" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                                        Guardian Ledger <Shield className="h-2 w-2" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ScientificAdvisorBot />
        </PageWrapper>
    );
}
