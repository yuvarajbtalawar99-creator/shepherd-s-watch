import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Dna, Database, Globe, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: 'scanning' | 'verifying' | 'success' | 'failed';
    recordName: string;
}

export default function VerificationModal({ isOpen, onClose, status, recordName }: VerificationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-sm glass-card p-8 text-center relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Animated Background Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />

                        <div className="mb-6 relative">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative z-10">
                                {status === 'success' ? (
                                    <ShieldCheck className="h-10 w-10 text-success" />
                                ) : (
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                )}
                            </div>

                            {/* Decorative Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-dashed border-primary/20 rounded-full"
                            />
                        </div>

                        <h3 className="text-lg font-bold text-foreground mb-2">
                            {status === 'scanning' && "Retrieving Ledger Proof..."}
                            {status === 'verifying' && "Verifying Integrity..."}
                            {status === 'success' && "Integrity Confirmed"}
                            {status === 'failed' && "Integrity Breach Detected"}
                        </h3>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                            {status === 'scanning' && `Fetching cryptographic hash for ${recordName} from the Polygon distributed network.`}
                            {status === 'verifying' && "Computing local SHA-256 fingerprint and matching against the immutable on-chain record."}
                            {status === 'success' && "Cryptographic match found. This record is guaranteed authentic and has not been altered since its creation."}
                            {status === 'failed' && "The local fingerprint does not match the blockchain anchor. Data may have been tampered with."}
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest border-b border-border/50 pb-2">
                                <span>Network</span>
                                <span className="text-foreground">Polygon POS</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest border-b border-border/50 pb-2">
                                <span>Security</span>
                                <span className="text-foreground">L2 Immutable</span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-8 rounded-xl bg-primary hover:bg-primary/90"
                            onClick={onClose}
                            disabled={status === 'scanning' || status === 'verifying'}
                        >
                            {status === 'success' ? "Access Trusted Record" : "Close"}
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
