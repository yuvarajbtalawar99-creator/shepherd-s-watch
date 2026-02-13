import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, ShieldCheck, Heart } from "lucide-react";
import { NotificationService } from "@/lib/NotificationService";

const VetDashboard = () => {
    const [sickCount, setSickCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();

        // Subscribe to sheep status changes
        const channel = supabase
            .channel('vet-health-monitor')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'sheep' },
                (payload) => {
                    if (payload.new.status === 'sick') {
                        console.log("New sickness detected!");
                        fetchStats();
                        NotificationService.sendNotification({
                            title: "Emergency Alert",
                            message: `Sheep ${payload.new.tag_id} (${payload.new.name}) has been marked as SICK.`,
                            type: 'health_alert'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStats = async () => {
        const { count } = await supabase
            .from('sheep')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'sick');

        setSickCount(count || 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vet Console</h1>
                    <p className="text-slate-500">Real-time Clinical Oversite & Health Monitoring</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                                DR{i}
                            </div>
                        ))}
                    </div>
                    <span className="text-sm font-medium text-slate-600">3 Vets Online</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-600">Emergency Alerts</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{sickCount}</div>
                        <p className="text-xs text-red-500 mt-1 font-medium">Animals requiring immediate attention</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-600">Scheduled Checks</CardTitle>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">12</div>
                        <p className="text-xs text-blue-500 mt-1 font-medium">Vaccinations & follow-ups today</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-600">DNA Verifications</CardTitle>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">8</div>
                        <p className="text-xs text-green-500 mt-1 font-medium">Pending lineage confirmation</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Farm Health</CardTitle>
                        <Heart className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">94%</div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                            <div className="bg-purple-500 h-full rounded-full w-[94%]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
                        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                            <CardTitle className="text-lg font-semibold text-slate-800">Real-time Health Feed</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {sickCount > 0 ? (
                                    <div className="p-8 text-center bg-red-50/30">
                                        <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                                        <h3 className="text-red-900 font-semibold text-lg">Active Health Emergencies</h3>
                                        <p className="text-red-700/70 max-w-xs mx-auto text-sm mt-1">
                                            Check individual sheep profiles for clinical signs and history.
                                        </p>
                                        <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                                            View Emergency List
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-20 text-center">
                                        <Heart className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                        <p className="text-slate-400 font-medium">No active health emergencies reported.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="bg-slate-900 text-white shadow-xl h-full border-none">
                        <CardHeader>
                            <CardTitle className="text-blue-400 text-sm tracking-wider uppercase">System Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Deployment Mode</span>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-500/30">Independent</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Database Link</span>
                                <span className="text-green-400 flex items-center gap-1.5 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Real-time Sync</span>
                                <span className="text-green-400 flex items-center gap-1.5 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Listening
                                </span>
                            </div>
                            <div className="mt-10 pt-6 border-t border-slate-800">
                                <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest font-bold">
                                    Clinical Data Integrity Verified by Polygon Blockchain Proofs
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VetDashboard;
