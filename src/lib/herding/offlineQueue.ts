import { supabase } from "@/lib/supabase";

export type HerdingEvent = {
    id: string;
    sheep_id: string;
    event_type: 'vaccinated' | 'sick' | 'pregnant' | 'vet';
    date: string;
    created_at: string;
    synced: boolean;
};

const STORAGE_KEY = 'shepherd_herding_queue';

export const offlineQueue = {
    // Add an event to the queue
    add: (event: Omit<HerdingEvent, 'synced' | 'id'>) => {
        const queue = offlineQueue.getAll();
        const newEvent: HerdingEvent = {
            ...event,
            id: crypto.randomUUID(),
            synced: false,
        };
        queue.push(newEvent);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return newEvent;
    },

    // Get all queued events
    getAll: (): HerdingEvent[] => {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    // Clear the queue
    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    // Remove specific events
    remove: (ids: string[]) => {
        const queue = offlineQueue.getAll().filter(e => !ids.includes(e.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    },

    // Sync to Supabase
    sync: async () => {
        const queue = offlineQueue.getAll();
        if (queue.length === 0) return { success: true, count: 0 };

        const eventsToSync = queue.map(e => ({
            sheep_id: e.sheep_id,
            type: e.event_type, // Mapping 'vaccinated' -> 'vaccination' if needed by DB schema? 
            // Let's assume DB uses 'vaccination', 'medical', etc. 
            // We might need to map types.
            date: e.date,
            notes: "Logged via Herding Mode",
            created_at: e.created_at
        }));

        // We need to map the event_type to the actual DB table and type
        // DB Tables: health_events, daily_tasks? 
        // Let's assume we insert into 'health_events' for now as a generic log.

        // Actually, let's map properly:
        // 'vaccinated' -> health_events (type: 'vaccination')
        // 'sick' -> sheep (status: 'sick') AND health_events (type: 'sickness')
        // 'pregnant' -> sheep (status: 'pregnant') AND health_events (type: 'pregnancy_check')
        // 'vet' -> health_events (type: 'vet_visit')

        // For simplicity in this "MVP" queue, we'll try to insert them as health_events.
        // Real-world: This needs a robust transaction.

        // Let's process one by one or batch by type to be safe.
        // For this implementation, we will iterate and process.

        let syncedCount = 0;
        const failedIds: string[] = [];

        for (const item of queue) {
            let error = null;

            // 1. Handle VACCINATED
            if (item.event_type === 'vaccinated') {
                const { error: e } = await supabase.from('health_events').insert({
                    sheep_id: item.sheep_id,
                    type: 'vaccination',
                    title: 'Vaccination',
                    description: 'Quick Log: Vaccination (Herding Mode)',
                    date: item.date,
                    verified: false
                });

                // Also try to complete any open vaccination tasks for this sheep
                if (!e) {
                    await supabase.from('daily_tasks')
                        .update({ completed: true })
                        .eq('sheep_id', item.sheep_id)
                        .eq('type', 'vaccination')
                        .eq('completed', false);
                }
                error = e;
            }
            // 2. Handle SICK
            else if (item.event_type === 'sick') {
                // Update sheep status + Log event
                const { error: e1 } = await supabase.from('sheep').update({ status: 'sick', risk_level: 'high' }).eq('id', item.sheep_id);
                const { error: e2 } = await supabase.from('health_events').insert({
                    sheep_id: item.sheep_id,
                    type: 'illness',
                    title: 'Illness Reported',
                    description: 'Quick Log: Reported Sick (Herding Mode)',
                    date: item.date,
                    verified: false
                });
                error = e1 || e2;
            }
            // 3. Handle PREGNANT
            else if (item.event_type === 'pregnant') {
                const { error: e1 } = await supabase.from('sheep').update({ status: 'pregnant' }).eq('id', item.sheep_id);
                const { error: e2 } = await supabase.from('health_events').insert({
                    sheep_id: item.sheep_id,
                    type: 'pregnancy',
                    title: 'Pregnancy Confirmed',
                    description: 'Quick Log: Confirmed Pregnant (Herding Mode)',
                    date: item.date,
                    verified: false
                });
                error = e1 || e2;
            }
            // 4. Handle VET
            else if (item.event_type === 'vet') {
                const { error: e } = await supabase.from('health_events').insert({
                    sheep_id: item.sheep_id,
                    type: 'vet_visit',
                    title: 'Vet Visit',
                    description: 'Quick Log: Vet Visit (Herding Mode)',
                    date: item.date,
                    verified: false
                });
                error = e;
            }

            if (!error) {
                syncedCount++;
            } else {
                console.error("Sync failed for", item, error);
                failedIds.push(item.id);
            }
        }

        // Remove success events, keep failed
        if (syncedCount > 0) {
            const remaining = queue.filter(e => failedIds.includes(e.id));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        }

        return { success: syncedCount > 0, count: syncedCount, pending: failedIds.length };
    }
};
