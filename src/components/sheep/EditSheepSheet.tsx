import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheep } from "@/types/sheep";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Camera, Upload, X, QrCode, FileText, ShieldCheck, BrainCircuit } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { DNAIntelligenceService } from "@/lib/dna/DNAIntelligenceService";
import { motion } from "framer-motion";

interface EditSheepSheetProps {
    sheep: Sheep;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export const EditSheepSheet = ({ sheep, open, onOpenChange, onUpdate }: EditSheepSheetProps) => {
    const [loading, setLoading] = useState(false);
    const [processingDNA, setProcessingDNA] = useState(false);
    const [formData, setFormData] = useState<Partial<Sheep>>({
        name: sheep.name,
        tag_id: sheep.tag_id,
        weight_kg: sheep.weight_kg,
        status: sheep.status,
        risk_level: sheep.risk_level,
        front_image_url: sheep.front_image_url,
        back_image_url: sheep.back_image_url,
        left_image_url: sheep.left_image_url,
        right_image_url: sheep.right_image_url,
        dna_report_url: sheep.dna_report_url,
        dna_verified: sheep.dna_verified,
        breed: sheep.breed,
        date_of_birth: sheep.date_of_birth,
        gender: sheep.gender,
    });

    const uploadImage = async (file: File, side: 'front' | 'back' | 'left' | 'right') => {
        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${sheep.id}_${side}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('sheep_photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('sheep_photos').getPublicUrl(filePath);

            const fieldName = `${side}_image_url` as keyof Sheep;
            setFormData(prev => ({ ...prev, [fieldName]: data.publicUrl }));
            toast.success(`${side.toUpperCase()} photo uploaded!`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload photo");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = async () => {
        try {
            const qrDataUrl = await QRCode.toDataURL(sheep.qr_code || sheep.id, {
                width: 1024,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff"
                }
            });

            const link = document.createElement("a");
            link.href = qrDataUrl;
            link.download = `QR_${sheep.tag_id}_${sheep.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("QR Code downloaded!");
        } catch (err) {
            console.error("Error downloading QR:", err);
            toast.error("Failed to download QR code");
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Auto-adjust health metrics if marked as sick
            const updatedData = { ...formData };
            if (formData.status === 'sick') {
                updatedData.health_score = 35;
                updatedData.risk_level = 'high';
            } else if (formData.status === 'healthy' && (formData.health_score || 0) < 60) {
                // If recovered, give a baseline healthy score if it was low
                updatedData.health_score = 85;
                updatedData.risk_level = 'low';
            }

            const { error } = await supabase
                .from('sheep')
                .update(updatedData)
                .eq('id', sheep.id);

            if (error) throw error;

            toast.success("Sheep details updated!");
            onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update sheep");
        } finally {
            setLoading(false);
        }
    };

    // Helper for Photo Upload Button
    const PhotoUpload = ({ side, currentUrl }: { side: 'front' | 'back' | 'left' | 'right', currentUrl?: string }) => {
        const inputRef = useRef<HTMLInputElement>(null);

        return (
            <div className="flex flex-col gap-2">
                <Label className="capitalize text-xs font-semibold text-muted-foreground">Now {side}</Label>
                <div
                    className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center bg-muted/50 cursor-pointer overflow-hidden relative group"
                    onClick={() => inputRef.current?.click()}
                >
                    {currentUrl ? (
                        <>
                            <img src={currentUrl} alt={side} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera className="text-white h-6 w-6" />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground p-2 text-center">
                            <Camera className="h-6 w-6" />
                            <span className="text-[10px] uppercase font-bold">Capture {side}</span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={inputRef}
                        className="hidden"
                        accept="image/*"
                        capture="environment" // Forces camera on mobile
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadImage(file, side);
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Edit Sheep Details</SheetTitle>
                    <SheetDescription>Update profile, health status, and photos.</SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">

                    {/* 1. Basic Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tag ID</Label>
                                <Input
                                    value={formData.tag_id || ''}
                                    onChange={e => setFormData({ ...formData, tag_id: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Breed</Label>
                                <Input
                                    value={formData.breed || ''}
                                    onChange={e => setFormData({ ...formData, breed: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={formData.date_of_birth || ''}
                                    onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(v: any) => setFormData({ ...formData, gender: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Weight (kg)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.weight_kg || ''}
                                    onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="healthy">Healthy</SelectItem>
                                        <SelectItem value="sick">Sick</SelectItem>
                                        <SelectItem value="pregnant">Pregnant</SelectItem>
                                        <SelectItem value="lactating">Lactating</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Risk Level</Label>
                                <Select
                                    value={formData.risk_level}
                                    onValueChange={(v: any) => setFormData({ ...formData, risk_level: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low Risk</SelectItem>
                                        <SelectItem value="medium">Medium Risk</SelectItem>
                                        <SelectItem value="high">High Risk</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Photo Grid (4 Angles) */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold">Sheep Photos (4 Angles)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <PhotoUpload side="front" currentUrl={formData.front_image_url} />
                            <PhotoUpload side="back" currentUrl={formData.back_image_url} />
                            <PhotoUpload side="left" currentUrl={formData.left_image_url} />
                            <PhotoUpload side="right" currentUrl={formData.right_image_url} />
                        </div>
                    </div>

                    {/* 3. DNA Documentation */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold">DNA Documentation</Label>
                        <div className="glass-card p-4 border-dashed border-2 flex flex-col items-center gap-3">
                            {formData.dna_report_url ? (
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">DNA Report Uploaded</p>
                                        <p className="text-[10px] text-muted-foreground">Verification status: {formData.dna_verified ? 'Verified' : 'Pending Review'}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => setFormData(prev => ({ ...prev, dna_report_url: undefined, dna_verified: false }))}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-3">Upload DNA certificate or test results (PDF/Image)</p>
                                    <input
                                        type="file"
                                        id="dna-upload"
                                        className="hidden"
                                        accept=".pdf,image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    setLoading(true);
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${sheep.id}_dna_${Date.now()}.${fileExt}`;
                                                    const { error: uploadError } = await supabase.storage
                                                        .from('sheep_photos')
                                                        .upload(fileName, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data } = supabase.storage.from('sheep_photos').getPublicUrl(fileName);
                                                    const publicUrl = data.publicUrl;
                                                    setFormData(prev => ({ ...prev, dna_report_url: publicUrl }));
                                                    toast.success("DNA report uploaded! Starting AI analysis...");

                                                    // Trigger AI Analysis (using local file for faster processing)
                                                    try {
                                                        setProcessingDNA(true);

                                                        if (file.type === 'application/pdf') {
                                                            toast.info("Analyzing PDF... Note: Image reports (JPG/PNG) usually provide higher accuracy.");
                                                        }

                                                        const result = await DNAIntelligenceService.processReport(sheep.id, file);

                                                        if (result.confidence_level < 0.2) {
                                                            toast.warning("Analysis complete, but very few markers were detected. Please ensure the report is clear.");
                                                        } else {
                                                            toast.success("Genetic Intelligence analysis complete!");
                                                        }
                                                        onUpdate(); // Refresh profile data
                                                    } catch (analysisErr: any) {
                                                        console.error("[UI] DNA Analysis Error:", analysisErr);
                                                        toast.error(`AI analysis failed: ${analysisErr.message || "Unknown error"}. The report was still saved.`);
                                                    } finally {
                                                        setProcessingDNA(false);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Failed to upload DNA report");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        disabled={loading || processingDNA}
                                        onClick={() => document.getElementById('dna-upload')?.click()}
                                    >
                                        <Upload className="h-4 w-4" /> Upload Report
                                    </Button>
                                    {processingDNA && (
                                        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse">
                                                <BrainCircuit className="h-4 w-4" />
                                                Genetic Intelligence Engine Active
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-bold">
                                                    <span>Analyzing Morphology</span>
                                                    <span>{Math.round(loading ? 45 : 90)}%</span>
                                                </div>
                                                <div className="w-full bg-primary/10 h-1 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: "10%" }}
                                                        animate={{ width: "95%" }}
                                                        transition={{ duration: 8, ease: "linear" }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-muted-foreground italic">"Scanning for PRNP, TMEM, and FECB clusters via proximity-hubs..."</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. QR Code (ReadOnly) */}
                    <div className="bg-muted/30 p-4 rounded-xl flex items-center gap-4 border border-border/50">
                        <div className="bg-white p-2 rounded-lg relative group">
                            <QRCodeSVG value={sheep.qr_code || sheep.id} size={64} />
                            <button
                                onClick={handleDownloadQR}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
                                title="Download QR"
                            >
                                <Upload className="text-white h-4 w-4 rotate-180" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Digital ID</p>
                            <p className="text-xs text-muted-foreground break-all">{sheep.qr_code || sheep.id}</p>
                        </div>
                    </div>

                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Changes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
