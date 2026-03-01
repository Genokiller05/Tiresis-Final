import { supabase } from '../lib/supabaseClient';
import type { GuardNotification } from '../types/supabase';

/**
 * Obtiene todas las notificaciones de un guardia, ordenadas por fecha (más recientes primero).
 */
export const fetchNotifications = async (guardId: string): Promise<GuardNotification[]> => {
    const { data, error } = await supabase
        .from('guard_notifications')
        .select('*')
        .eq('guard_id', guardId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
};

/**
 * Obtiene el conteo de notificaciones no leídas.
 */
export const getUnreadCount = async (guardId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('guard_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('guard_id', guardId)
        .eq('is_read', false);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
};

/**
 * Marca una notificación como leída.
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
    const { error } = await supabase
        .from('guard_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
    }
};

/**
 * Marca todas las notificaciones de un guardia como leídas.
 */
export const markAllAsRead = async (guardId: string): Promise<void> => {
    const { error } = await supabase
        .from('guard_notifications')
        .update({ is_read: true })
        .eq('guard_id', guardId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all as read:', error);
    }
};

/**
 * Suscripción en tiempo real a nuevas notificaciones.
 * Devuelve una función para cancelar la suscripción.
 */
export const subscribeToNotifications = (
    guardId: string,
    onNewNotification: (notification: GuardNotification) => void
) => {
    const channel = supabase
        .channel(`guard-notifications-${guardId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'guard_notifications',
                filter: `guard_id=eq.${guardId}`,
            },
            (payload) => {
                onNewNotification(payload.new as GuardNotification);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
