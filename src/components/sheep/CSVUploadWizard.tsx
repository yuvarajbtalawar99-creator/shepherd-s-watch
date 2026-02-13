import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileUp, Check, Loader2, Download,
    X, AlertCircle, Sparkles, ChevronRight, FileSpreadsheet,
    ArrowRight, LayoutDashboard, Footprints
} from "lucide-react";
import { parseSheepCSV, CSVParsedSheep } from "@/lib/utils/csvParser";
import { generateQRSheet } from "@/lib/QRSheetGenerator";

interface CSVUploadWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type Step = "upload" | "preview" | "processing" | "success";

export default function CSVUploadWizard({
    open,
    onOpenChange,
    onSuccess
}: CSVUploadWizardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("upload");
    const [parsedSheep, setParsedSheep] = useState<CSVParsedSheep[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [createdSheep, setCreatedSheep] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error("Invalid file type. Please upload a CSV file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const sheep = parseSheepCSV(text);

                if (sheep.length === 0) {
                    toast.error("No valid sheep data found. Please check your CSV headers.");
                    return;
                }

                setParsedSheep(sheep);
                setStep("preview");
            } catch (err) {
                console.error("CSV Parse Error:", err);
                toast.error("Failed to parse CSV file. Ensure it's correctly formatted.");
            }
        };
        reader.onerror = () => toast.error("Error reading file.");
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!user || parsedSheep.length === 0) return;

        setStep("processing");
        setIsProcessing(true);
        setProgress(0);

        try {
            // 1. Fetch ALL existing tags to find the true maximum and check for collisions
            const { data: existingSheep } = await supabase
                .from("sheep")
                .select("tag_id")
                .eq("owner_id", user.id);

            const existingTags = new Set(existingSheep?.map(s => s.tag_id) || []);

            // 2. Determine starting number from highest SC-XXX
            let maxNum = 0;
            existingTags.forEach(tag => {
                const match = tag.match(/SC-(\d+)/i);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNum) maxNum = num;
                }
            });

            // 3. Prepare objects with collision detection
            const sheepToCreate = [];
            let currentAutoNum = maxNum + 1;

            for (const s of parsedSheep) {
                let tag_id = s.tag_id?.trim();

                // If tag provided in CSV exists, error early or skip
                if (tag_id && existingTags.has(tag_id)) {
                    throw new Error(`Tag ID "${tag_id}" already exists in your registry.`);
                }

                if (!tag_id) {
                    // Generate next available SC-XXX
                    while (existingTags.has(`SC-${String(currentAutoNum).padStart(3, '0')}`)) {
                        currentAutoNum++;
                    }
                    tag_id = `SC-${String(currentAutoNum).padStart(3, '0')}`;
                    currentAutoNum++;
                }

                sheepToCreate.push({
                    tag_id,
                    name: s.name,
                    breed: s.breed || "Merino",
                    date_of_birth: s.date_of_birth || null,
                    gender: s.gender || 'female',
                    weight_kg: s.weight_kg || null,
                    health_score: 100,
                    risk_level: 'low',
                    status: 'healthy',
                    owner_id: user.id
                });

                // Add to temporary set to prevent duplicates within the same batch
                existingTags.add(tag_id);
            }

            // Batch processing in chunks of 50
            const batchSize = 50;
            const newlyCreated = [];

            for (let i = 0; i < sheepToCreate.length; i += batchSize) {
                const batch = sheepToCreate.slice(i, i + batchSize);
                const { data, error } = await supabase
                    .from("sheep")
                    .insert(batch)
                    .select();

                if (error) throw error;
                if (data) newlyCreated.push(...data);

                setProgress(Math.min(((i + batch.length) / sheepToCreate.length) * 100, 100));
            }

            setCreatedSheep(newlyCreated);
            setStep("success");
            toast.success(`Successfully registered ${newlyCreated.length} sheep.`);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Upload Error:", err);
            toast.error(err.message || "Failed to import herd. Check for duplicate Tag IDs.");
            setStep("upload");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadQR = async () => {
        if (createdSheep.length === 0) return;
        toast.info("Preparing QR Sheets...");
        try {
            await generateQRSheet(createdSheep);
            toast.success("QR PDF Generated!");
        } catch (err) {
            toast.error("Failed to generate QR Sheet.");
        }
    };

    const reset = () => {
        setStep("upload");
        setParsedSheep([]);
        setCreatedSheep([]);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!isProcessing) {
                if (!val) reset();
                onOpenChange(val);
            }
        }}>
            <DialogContent className="sm:max-w-2xl">
                <AnimatePresence mode="wait">
                    {/* Step 1: Upload */}
                    {step === "upload" && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6 py-6 text-center"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-heading font-bold">Import CSV</h2>
                                <p className="text-muted-foreground text-sm">
                                    Upload a CSV with sheep names and details. Tag IDs will be auto-generated if missing.
                                </p>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-primary/20 rounded-2xl p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                />
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Click to select CSV</p>
                                        <p className="text-xs text-muted-foreground mt-1">or drag and drop file here</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/50 rounded-xl p-4 text-left">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                    <Download className="h-3 w-3" /> Recommended Headers
                                </p>
                                <code className="text-[10px] text-primary">name, tag_id, breed, gender, weight_kg, dob</code>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Preview */}
                    {step === "preview" && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 py-4"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Review Import
                                </h2>
                                <Button variant="ghost" size="sm" onClick={() => setStep("upload")} className="text-muted-foreground">
                                    <X className="h-4 w-4 mr-2" /> Change File
                                </Button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto border border-primary/10 rounded-xl bg-muted/5">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0 backdrop-blur-sm">
                                        <tr>
                                            <th className="p-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Name</th>
                                            <th className="p-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Tag (Auto)</th>
                                            <th className="p-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Breed</th>
                                            <th className="p-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-right">Gender</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {parsedSheep.map((s, i) => (
                                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                <td className="p-3 font-semibold">{s.name}</td>
                                                <td className="p-3 text-primary text-xs font-mono">{s.tag_id || "Gen Sequence"}</td>
                                                <td className="p-3 text-muted-foreground text-xs">{s.breed || "Merino"}</td>
                                                <td className="p-3 text-muted-foreground text-xs text-right capitalize">{s.gender || "female"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Button onClick={handleUpload} className="w-full h-14 text-lg rounded-xl gap-2 shadow-xl bg-primary hover:bg-primary/95">
                                Confirm & Register {parsedSheep.length} Sheep
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 3: Processing */}
                    {step === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 py-12 text-center"
                        >
                            <div className="relative inline-flex items-center justify-center">
                                <Loader2 className="h-20 w-20 text-primary animate-spin" />
                                <Sparkles className="absolute h-8 w-8 text-primary animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-heading font-bold">Registering Herd...</h2>
                                <p className="text-muted-foreground">Building unique IDs and securing your data</p>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-primary/5">
                                <motion.div
                                    className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs font-mono text-primary/60">{Math.round(progress)}% Complete</p>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 py-8"
                        >
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-success/5">
                                    <Check className="h-12 w-12 text-success" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-heading font-bold tracking-tight">Herd Ready!</h2>
                                    <p className="text-muted-foreground text-lg">
                                        We've successfully registered **{createdSheep.length}** sheep to your account.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => { onOpenChange(false); navigate("/registry"); }}
                                        className="h-24 flex-col gap-2 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all border-2"
                                    >
                                        <LayoutDashboard className="h-6 w-6" />
                                        <span className="font-bold">Registry</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => { onOpenChange(false); navigate("/herding"); }}
                                        className="h-24 flex-col gap-2 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all border-2"
                                    >
                                        <Footprints className="h-6 w-6" />
                                        <span className="font-bold">Herding</span>
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleDownloadQR}
                                    className="h-20 text-lg rounded-2xl gap-3 shadow-xl bg-gradient-to-r from-success to-emerald-600 hover:opacity-95 text-white border-none"
                                >
                                    <Download className="h-6 w-6" />
                                    Download All QR Codes
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="w-full text-muted-foreground"
                            >
                                Dismiss
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
