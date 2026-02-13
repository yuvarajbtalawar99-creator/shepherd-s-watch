import { supabase } from "@/lib/supabase";

export type NotificationType = 'health_alert' | 'task_reminder' | 'dna_analysis' | 'system' | 'bulk_import';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    link?: string;
    created_at: string;
}

export class NotificationService {
    /**
     * Fetch unread notifications for the current user
     */
    static async getUnreadNotifications(): Promise<Notification[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("[Notification Service] Fetch Error:", error);
            return [];
        }

        return data as Notification[];
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error("[Notification Service] Mark Read Error:", error);
            return false;
        }
        return true;
    }

    /**
     * Mark all notifications as read for current user
     */
    static async markAllAsRead(): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        if (error) {
            console.error("[Notification Service] Mark All Read Error:", error);
            return false;
        }
        return true;
    }

    /**
     * Create a new notification (Internal use)
     */
    static async sendNotification(payload: {
        title: string;
        message: string;
        type: NotificationType;
        link?: string;
        userId?: string;
    }): Promise<boolean> {
        let targetUserId = payload.userId;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;
            targetUserId = user.id;
        }

        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: targetUserId,
                title: payload.title,
                message: payload.message,
                type: payload.type,
                link: payload.link
            });

        if (error) {
            console.error("[Notification Service] Send Error:", error);
            return false;
        }
        return true;
    }
}
