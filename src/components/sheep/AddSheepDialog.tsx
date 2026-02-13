import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Check, Download, Share2, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { Sheep } from "@/types/sheep";

// Form validation schema
const sheepFormSchema = z.object({
    tag_id: z.string().min(1, "Tag ID is required"),
    name: z.string().min(1, "Name is required"),
    breed: z.string().min(1, "Breed is required"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female"], {
        required_error: "Gender is required",
    }),
    weight_kg: z.coerce.number().positive("Weight must be positive"),
    status: z.enum(["healthy", "sick", "pregnant", "lactating"], {
        required_error: "Status is required",
    }),
    image_url: z.string().optional(),
});

type SheepFormValues = z.infer<typeof sheepFormSchema>;

interface AddSheepDialogProps {
    children?: React.ReactNode;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddSheepDialog({ children, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: AddSheepDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdSheep, setCreatedSheep] = useState<Sheep | null>(null);
    const { user } = useAuth();

    // Use controlled state if provided, otherwise internal state
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const form = useForm<SheepFormValues>({
        resolver: zodResolver(sheepFormSchema),
        defaultValues: {
            tag_id: "",
            name: "",
            breed: "",
            date_of_birth: "",
            gender: "female",
            weight_kg: 0,
            status: "healthy",
            image_url: "",
        },
    });

    const onSubmit = async (data: SheepFormValues) => {
        try {
            setIsSubmitting(true);

            // Insert sheep into database
            const { data: newSheep, error } = await supabase
                .from("sheep")
                .insert({
                    tag_id: data.tag_id,
                    name: data.name,
                    breed: data.breed,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender,
                    weight_kg: data.weight_kg,
                    status: data.status,
                    image_url: data.image_url || null,
                    owner_id: user!.id,
                    health_score: 100, // Default health score
                    risk_level: "low", // Default risk level
                })
                .select()
                .single();

            if (error) {
                console.error("Error adding sheep:", error);
                toast.error("Failed to add sheep", {
                    description: error.message,
                });
                return;
            }

            // Update with qr_code (defaulting to ID)
            await supabase
                .from("sheep")
                .update({ qr_code: newSheep.id })
                .eq("id", newSheep.id);

            const sheepWithQR = { ...newSheep, qr_code: newSheep.id };
            setCreatedSheep(sheepWithQR);

            toast.success("Sheep added successfully!");

            setShowSuccess(true);
            form.reset();

            // Call success callback to refresh the list
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => {
            setShowSuccess(false);
            setCreatedSheep(null);
        }, 300);
    };

    const handleDownloadQR = async () => {
        if (!createdSheep) return;
        try {
            const qrDataUrl = await QRCode.toDataURL(createdSheep.qr_code || createdSheep.id, {
                width: 1024,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff"
                }
            });

            const link = document.createElement("a");
            link.href = qrDataUrl;
            link.download = `QR_${createdSheep.tag_id}_${createdSheep.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("QR Code downloaded!");
        } catch (err) {
            console.error("Error downloading QR:", err);
            toast.error("Failed to download QR code");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            else setOpen(true);
        }}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                {!showSuccess ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Add New Sheep</DialogTitle>
                            <DialogDescription>
                                Enter the details of the new sheep to add to your flock.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Tag ID */}
                                    <FormField
                                        control={form.control}
                                        name="tag_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tag ID *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="SC-001" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Name */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Bella" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Breed */}
                                    <FormField
                                        control={form.control}
                                        name="breed"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Breed *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Merino" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Date of Birth */}
                                    <FormField
                                        control={form.control}
                                        name="date_of_birth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date of Birth *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Gender */}
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="male">Male</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Weight */}
                                    <FormField
                                        control={form.control}
                                        name="weight_kg"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Weight (kg) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="45.5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Status */}
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Status *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="healthy">Healthy</SelectItem>
                                                        <SelectItem value="sick">Sick</SelectItem>
                                                        <SelectItem value="pregnant">Pregnant</SelectItem>
                                                        <SelectItem value="lactating">Lactating</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Image URL (Optional) */}
                                    <FormField
                                        control={form.control}
                                        name="image_url"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Image URL (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://example.com/sheep-image.jpg"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isSubmitting ? "Adding..." : "Add Sheep"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                ) : (
                    <div className="py-6 text-center">
                        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-success" />
                        </div>
                        <DialogTitle className="text-2xl mb-2">Sheep Added!</DialogTitle>
                        <DialogDescription className="mb-6">
                            {createdSheep?.name} has been successfully registered. Here is the unique Digital Identity (QR Code).
                        </DialogDescription>

                        <div className="bg-white p-6 rounded-2xl inline-block border shadow-sm mb-6">
                            <QRCodeSVG value={createdSheep?.qr_code || createdSheep?.id || ""} size={200} level="H" />
                            <p className="mt-4 font-mono text-sm text-foreground">{createdSheep?.tag_id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                            <Button variant="outline" className="gap-2" onClick={handleDownloadQR}>
                                <Download className="h-4 w-4" /> Download
                            </Button>
                            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                                <Share2 className="h-4 w-4" /> Print
                            </Button>
                            <Button className="col-span-2 gap-2" onClick={() => setShowSuccess(false)}>
                                <Plus className="h-4 w-4" /> Add Another Sheep
                            </Button>
                        </div>

                        <Button variant="ghost" className="mt-4" onClick={handleClose}>
                            Done for now
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
