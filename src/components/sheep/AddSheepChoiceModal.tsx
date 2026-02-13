import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Plus, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import CSVUploadWizard from "./CSVUploadWizard";

interface AddSheepChoiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChooseSingle: () => void;
    onChooseBulk: () => void;
    onSuccess?: () => void;
}

export default function AddSheepChoiceModal({
    open,
    onOpenChange,
    onChooseSingle,
    onChooseBulk,
    onSuccess
}: AddSheepChoiceModalProps) {
    const [showCSV, setShowCSV] = useState(false);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-heading">Add Sheep</DialogTitle>
                        <DialogDescription>
                            Choose how you'd like to add sheep to your flock
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 py-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={() => {
                                    onOpenChange(false);
                                    onChooseSingle();
                                }}
                                variant="outline"
                                className="w-full h-20 text-lg rounded-xl justify-start px-6 gap-4 hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                <Plus className="h-6 w-6" />
                                <div className="text-left">
                                    <div className="font-bold">Add Single</div>
                                    <div className="text-[10px] opacity-80 uppercase tracking-widest">Manual Entry</div>
                                </div>
                            </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={() => {
                                    onOpenChange(false);
                                    onChooseBulk();
                                }}
                                className="w-full h-20 text-lg rounded-xl justify-start px-6 gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 border-none transition-all"
                            >
                                <Users className="h-6 w-6" />
                                <div className="text-left">
                                    <div className="font-bold">Quick Bulk Add</div>
                                    <div className="text-[10px] opacity-80 uppercase tracking-widest">Auto-Generated IDs</div>
                                </div>
                            </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={() => {
                                    onOpenChange(false);
                                    setShowCSV(true);
                                }}
                                variant="outline"
                                className="w-full h-20 text-lg rounded-xl justify-start px-6 gap-4 border-dashed border-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
                            >
                                <FileSpreadsheet className="h-6 w-6 text-amber-500" />
                                <div className="text-left">
                                    <div className="font-bold">Upload CSV</div>
                                    <div className="text-[10px] opacity-80 uppercase tracking-widest">Excel / Google Sheets</div>
                                </div>
                            </Button>
                        </motion.div>
                    </div>
                </DialogContent>
            </Dialog>

            <CSVUploadWizard
                open={showCSV}
                onOpenChange={setShowCSV}
                onSuccess={onSuccess}
            />
        </>
    );
}
