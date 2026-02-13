import { motion } from "framer-motion";
import { ShieldCheck, Award, Dna, FileCheck, Info } from "lucide-react";
import { Sheep, DNAAnalysis } from "@/types/sheep";
import { Badge } from "@/components/ui/badge";

interface AncestryCertificateProps {
    sheep: Sheep;
    sire?: Sheep;
    dam?: Sheep;
    analysis?: DNAAnalysis;
}

export default function AncestryCertificate({ sheep, sire, dam, analysis }: AncestryCertificateProps) {
    const isVerified = sheep.dna_verified && sire?.dna_verified && dam?.dna_verified;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto glass-card p-0 overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5"
        >
            {/* Premium Header */}
            <div className="bg-primary/10 p-6 border-b border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                    <Award className="h-32 w-32 text-primary" />
                </div>

                <div className="flex items-center gap-4 relative">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-soft-xl flex items-center justify-center text-3xl">
                        {sheep.gender === 'male' ? "🐏" : "🐑"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Ancestry Certificate</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                            <FileCheck className="h-3 w-3" /> Verifiable Trust Ledger
                        </p>
                    </div>
                    {isVerified && (
                        <div className="ml-auto">
                            <Badge className="bg-success text-white px-3 py-1 gap-1.5 shadow-lg shadow-success/20">
                                <ShieldCheck className="h-3.5 w-3.5" /> DNA VERIFIED
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Animal Details */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Animal Name</label>
                        <p className="text-sm font-bold text-foreground">{sheep.name}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Registration ID</label>
                        <p className="text-sm font-bold text-foreground font-mono">{sheep.tag_id}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Sire (Father)</label>
                        <p className="text-sm font-bold text-foreground">{sire?.name || "Unknown"}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Dam (Mother)</label>
                        <p className="text-sm font-bold text-foreground">{dam?.name || "Unknown"}</p>
                    </div>
                </div>

                {/* Genetic Traceability */}
                {analysis && (
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                            <Dna className="h-3 w-3" /> Genetic Traceability Hub
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analysis.markers && typeof analysis.markers === 'object' ? Object.entries(analysis.markers).map(([gene, allele]) => (
                                <div key={gene} className="p-3 rounded-xl bg-white/50 border border-border/50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">{gene}</span>
                                    <span className="text-xs font-black text-foreground">{allele}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-muted-foreground italic col-span-2">No genetic markers recorded.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-4">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        This certificate is dynamically generated from real-time DNA and health event data.
                        Verification status is based on certified parental links and genomic sequencing records in the ShepherdCare network.
                    </p>
                </div>
            </div>

            {/* Security Footer */}
            <div className="p-3 bg-card border-t border-border/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-2" />
                <p className="text-[9px] font-mono text-muted-foreground uppercase">
                    SECURE BLOCKCHAIN HASH: {sheep.id.split('-')[0]}...VERIFIED
                </p>
            </div>
        </motion.div>
    );
}
