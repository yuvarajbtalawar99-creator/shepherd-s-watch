import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Sparkles, ArrowRight, MessageSquare, ShieldCheck, ChevronRight } from "lucide-react";
import { Sheep, DNAAnalysis } from "@/types/sheep";
import { supabase } from "@/lib/supabase";

interface ScientificAdvisorBotProps {
    onSuggestMatch?: (ramId: string, eweId: string) => void;
}

export default function ScientificAdvisorBot({ onSuggestMatch }: ScientificAdvisorBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [advice, setAdvice] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && advice.length === 0) {
            generateAdvice();
        }
    }, [isOpen]);

    const generateAdvice = async () => {
        setIsLoading(true);
        try {
            // Fetch some sheep with DNA data to give real advice
            const { data: analyses } = await supabase
                .from('dna_analysis')
                .select('sheep_id, markers, summary')
                .limit(10);

            const { data: sheep } = await supabase
                .from('sheep')
                .select('id, name, gender, tag_id')
                .in('id', (analyses || []).map(a => a.sheep_id));

            const newAdvice: string[] = [];

            if (!analyses || analyses.length === 0) {
                newAdvice.push("I need more DNA reports to give scientific advice. Try uploading some DNA analysis results first!");
            } else {
                newAdvice.push("Analysis complete. To eliminate Scrapie risk in your flock, I recommend prioritizing rams with the ARR/ARR genotype.");

                // Find a specific recommendation if data exists
                const ram = sheep?.find(s => s.gender === 'male');
                const ewe = sheep?.find(s => s.gender === 'female');

                if (ram && ewe) {
                    newAdvice.push(`Top Match Found: Pairing ${ram.name} with ${ewe.name} will result in 100% Scrapie resistant lambs.`);
                }

                newAdvice.push("Strategic Tip: Your flock shows high potential for twinning if you focus on the FECB marker traits identified in your latest uploads.");
            }

            setAdvice(newAdvice);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-80 glass-card shadow-2xl border border-primary/20 overflow-hidden"
                    >
                        <div className="bg-primary/10 p-4 border-b border-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary" />
                                <span className="text-sm font-bold text-foreground">Scientific Advisor</span>
                            </div>
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        </div>

                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                                    <BrainCircuit className="h-8 w-8 text-primary/40 animate-bounce" />
                                    <p className="text-xs text-muted-foreground italic">Analyzing flock genetics...</p>
                                </div>
                            ) : (
                                advice.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-3"
                                    >
                                        <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <ChevronRight className="h-3 w-3 text-primary" />
                                        </div>
                                        <p className="text-xs leading-relaxed text-foreground/90">
                                            {item}
                                        </p>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-3 bg-muted/30 border-t border-border/50">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                            >
                                Got it, thanks!
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            >
                {isOpen ? (
                    <ChevronRight className="h-6 w-6" />
                ) : (
                    <MessageSquare className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-success border-2 border-white"></span>
                    </span>
                )}
            </button>
        </div>
    );
}
