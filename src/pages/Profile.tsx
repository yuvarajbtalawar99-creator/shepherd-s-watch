import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, MapPin, Home, Hash, Save, Loader2 } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";

export default function Profile() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        full_name: "",
        village: "",
        location: "",
        herder_id: "",
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("full_name, village, location, herder_id")
                .eq("id", user?.id)
                .single();

            if (error) throw error;
            if (data) {
                const profileData = data as any;
                setProfile({
                    full_name: profileData.full_name || "",
                    village: profileData.village || "",
                    location: profileData.location || "",
                    herder_id: profileData.herder_id || "",
                });
            }
        } catch (error: any) {
            toast.error("Error fetching profile", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    village: profile.village,
                    location: profile.location,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user?.id);

            if (error) throw error;
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error("Error updating profile", { description: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PageWrapper title={t('profileTitle') || "My Profile"} subtitle={t('manageProfileSubtitle') || "Manage your herder information and unique ID"}>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Unique ID Card */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <Hash className="h-4 w-4" /> {t('herderIdLabel') || "Herder Unique ID"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {t('herderIdDescription') || "This ID will be used for future Vet Dashboard integrations."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-mono font-bold tracking-[0.5em] text-primary py-4">
                            {profile.herder_id || "------"}
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" /> {t('personalInfoLabel') || "Personal Information"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" /> {t('fullNameLabel') || "Full Name"}
                            </Label>
                            <Input
                                id="fullName"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="village" className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-muted-foreground" /> {t('villageLabel') || "Village"}
                                </Label>
                                <Input
                                    id="village"
                                    value={profile.village}
                                    onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                                    placeholder="Enter your village"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" /> {t('locationLabel') || "Location / District"}
                                </Label>
                                <Input
                                    id="location"
                                    value={profile.location}
                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                    placeholder="Enter your district"
                                />
                            </div>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto mt-4">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t('saveChanges') || "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground italic">
                            {t('profileNote') || "Note: Your email and unique ID cannot be changed."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PageWrapper>
    );
}
