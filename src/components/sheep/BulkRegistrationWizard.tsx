import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, Plus, Minus, Check, Loader2, Download,
    Sparkles, ChevronRight, ArrowLeft
} from "lucide-react";
import { generateQRSheet } from "@/lib/QRSheetGenerator";
import { Input } from "@/components/ui/input";

interface BulkRegistrationWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type Step = "count" | "processing" | "success";

interface GeneratedSheep {
    id: string;
    tag_id: string;
    name: string;
    qr_code: string;
}

export default function BulkRegistrationWizard({
    open,
    onOpenChange,
    onSuccess
}: BulkRegistrationWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>("count");
    const [sheepCount, setSheepCount] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generatedSheep, setGeneratedSheep] = useState<GeneratedSheep[]>([]);

    // Voice recognition setup
    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Voice input not supported in this browser");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            toast.info("Listening... Say the number of sheep");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            const number = extractNumberFromSpeech(transcript);

            if (number > 0) {
                setSheepCount(number);
                toast.success(`Got it! ${number} sheep`);
            } else {
                toast.error("Couldn't understand the number. Please try again.");
            }
        };

        recognition.onerror = () => {
            toast.error("Voice input failed. Please use buttons instead.");
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // Extract number from speech
    const extractNumberFromSpeech = (text: string): number => {
        const numberWords: { [key: string]: number } = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
            'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
            'hundred': 100, 'thousand': 1000
        };

        // Try to extract direct number
        const directNumber = text.match(/\d+/);
        if (directNumber) {
            return parseInt(directNumber[0]);
        }

        // Try to parse word numbers
        let total = 0;
        const words = text.split(/\s+/);

        for (const word of words) {
            if (numberWords[word]) {
                total += numberWords[word];
            }
        }

        return total;
    };

    // Generate sheep in bulk
    const generateBulkSheep = async () => {
        if (!user || sheepCount === 0) return;

        setStep("processing");
        setIsProcessing(true);
        setProgress(0);

        try {
            // Get the last tag number
            const { data: existingSheep } = await supabase
                .from("sheep")
                .select("tag_id")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            let startingNumber = 1;
            if (existingSheep && existingSheep.length > 0) {
                const lastTag = existingSheep[0].tag_id;
                const match = lastTag.match(/\d+$/);
                if (match) {
                    startingNumber = parseInt(match[0]) + 1;
                }
            }

            // Generate sheep records
            const sheepToCreate = [];
            for (let i = 0; i < sheepCount; i++) {
                const tagNumber = startingNumber + i;
                sheepToCreate.push({
                    tag_id: `SC-${String(tagNumber).padStart(3, '0')}`,
                    name: `A${tagNumber}`,
                    status: 'healthy' as const,
                    health_score: 100,
                    risk_level: 'low' as const,
                    owner_id: user.id,
                    // Optional fields left null for progressive disclosure
                    breed: null,
                    date_of_birth: null,
                    gender: null,
                    weight_kg: null,
                    image_url: null,
                });
            }

            // Insert in batches of 50
            const batchSize = 50;
            const createdSheep: GeneratedSheep[] = [];

            for (let i = 0; i < sheepToCreate.length; i += batchSize) {
                const batch = sheepToCreate.slice(i, i + batchSize);

                const { data, error } = await supabase
                    .from("sheep")
                    .insert(batch)
                    .select("id, tag_id, name");

                if (error) throw error;

                if (data) {
                    // Update the newly created sheep with their IDs as QR codes
                    // Note: In a real production app, we might do this in a single trigger or function
                    // but for this implementation we'll explicitly update them or just assume they are ID-based.
                    // The migration already set the default. 
                    // Let's explicitly fetch 'qr_code' if we need it in the UI.
                    const { data: updatedData } = await supabase
                        .from('sheep')
                        .select('id, tag_id, name, qr_code')
                        .in('id', data.map(s => s.id));

                    if (updatedData) {
                        createdSheep.push(...updatedData as any);
                    }
                }

                // Update progress
                const currentProgress = Math.min(((i + batch.length) / sheepToCreate.length) * 100, 100);
                setProgress(currentProgress);
            }

            setGeneratedSheep(createdSheep);
            setStep("success");
            toast.success(`Successfully created ${sheepCount} sheep!`);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Error creating sheep:", error);
            toast.error("Failed to create sheep. Please try again.");
            setStep("count");
        } finally {
            setIsProcessing(false);
        }
    };

    // Reset wizard
    const resetWizard = () => {
        setStep("count");
        setSheepCount(0);
        setProgress(0);
        setGeneratedSheep([]);
    };

    // Handle close
    const handleClose = () => {
        if (!isProcessing) {
            resetWizard();
            onOpenChange(false);
        }
    };

    const handleDownloadQR = async () => {
        if (generatedSheep.length > 0) {
            toast.info("Generating PDF...");
            try {
                await generateQRSheet(generatedSheep);
                toast.success("QR Sheet downloaded!");
            } catch (error) {
                console.error("Error generating PDF:", error);
                toast.error("Failed to generate PDF");
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <AnimatePresence mode="wait">
                    {/* Step 1: Count Input */}
                    {step === "count" && (
                        <motion.div
                            key="count"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 py-6"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-heading font-bold text-foreground">
                                    Add Your Herd
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    How many sheep do you have?
                                </p>
                            </div>

                            {/* Voice Input Button */}
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    onClick={startVoiceInput}
                                    disabled={isListening}
                                    className={`w-32 h-32 rounded-full text-6xl shadow-lg transition-all ${isListening
                                        ? 'bg-destructive hover:bg-destructive animate-pulse'
                                        : 'bg-primary hover:bg-primary/90'
                                        }`}
                                >
                                    <Mic className={isListening ? "animate-pulse" : ""} />
                                </Button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                Tap the microphone and say the number
                            </div>

                            {/* Number Display */}
                            <div className="flex items-center justify-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setSheepCount(Math.max(0, sheepCount - 1))}
                                    className="h-16 w-16 rounded-xl"
                                >
                                    <Minus className="h-6 w-6" />
                                </Button>

                                <Input
                                    type="number"
                                    value={sheepCount}
                                    onChange={(e) => setSheepCount(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="text-center text-4xl font-bold h-20 w-40 rounded-xl"
                                    min="0"
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setSheepCount(sheepCount + 1)}
                                    className="h-16 w-16 rounded-xl"
                                >
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* Quick Add Buttons */}
                            <div className="grid grid-cols-4 gap-3">
                                {[10, 50, 100, 200].map((num) => (
                                    <Button
                                        key={num}
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSheepCount(sheepCount + num)}
                                        className="h-16 text-lg font-semibold rounded-xl hover:bg-primary hover:text-primary-foreground"
                                    >
                                        +{num}
                                    </Button>
                                ))}
                            </div>

                            {/* Continue Button */}
                            <Button
                                onClick={generateBulkSheep}
                                disabled={sheepCount === 0}
                                className="w-full h-16 text-lg rounded-xl gap-2"
                            >
                                Continue with {sheepCount} sheep
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 2: Processing */}
                    {step === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 py-12 text-center"
                        >
                            <Sparkles className="h-16 w-16 mx-auto text-primary animate-pulse" />

                            <div className="space-y-2">
                                <h2 className="text-2xl font-heading font-bold text-foreground">
                                    Creating Your Herd...
                                </h2>
                                <p className="text-muted-foreground">
                                    Generating {sheepCount} sheep with unique IDs and QR codes
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {Math.round(progress)}% complete
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Success */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 py-6"
                        >
                            <div className="text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                >
                                    <Check className="h-20 w-20 mx-auto text-success" />
                                </motion.div>

                                <h2 className="text-3xl font-heading font-bold text-foreground">
                                    Success!
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    Successfully created {generatedSheep.length} sheep
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Button
                                    onClick={handleDownloadQR}
                                    variant="outline"
                                    className="h-20 text-lg rounded-xl gap-2 hover:bg-muted/50"
                                >
                                    <Download className="h-5 w-5" />
                                    Download QR Sheet
                                </Button>

                                <Button
                                    onClick={() => {
                                        handleClose();
                                        // TODO: Navigate to herding mode
                                    }}
                                    className="h-20 text-lg rounded-xl gap-2"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    Start Herding
                                </Button>
                            </div>

                            <Button
                                onClick={handleClose}
                                variant="ghost"
                                className="w-full"
                            >
                                View in Registry
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
