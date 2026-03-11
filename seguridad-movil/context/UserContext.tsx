import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Guard } from '../types/supabase';
import { updateGuardStatus } from '../services/dataService';

interface UserContextType {
    user: Guard | null;
    login: (userData: Guard) => void;
    logout: () => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Guard | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [presenceChannel, setPresenceChannel] = useState<any>(null);
    const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (!user) return;
            const userAny = user as any;
            const userId = userAny.idEmpleado || userAny.document_id || userAny.id || '';
            if (!userId) return;

            try {
                if (nextAppState === 'active') {
                    updateGuardStatus(userId, 'En servicio').catch(console.error);
                } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                    updateGuardStatus(userId, 'Fuera de servicio').catch(console.error);
                }
            } catch (error) {
                console.error('Error updating guard status based on AppState:', error);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [user]);

    // Realtime subscription: listen for profile changes made by admin on web
    const realtimeIdRef = user?.idEmpleado || (user as any)?.document_id || '';
    useEffect(() => {
        if (!realtimeIdRef) return;

        let channel: any = null;
        const setupRealtime = async () => {
            const { supabase } = await import('../lib/supabase');
            channel = supabase
                .channel('guard-profile-' + realtimeIdRef)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'guards',
                        filter: `idEmpleado=eq.${realtimeIdRef}`,
                    },
                    (payload: any) => {
                        console.log('[Realtime] Guard profile updated from web:', payload.new);
                        if (payload.new) {
                            setUser((prev: any) => {
                                if (!prev) return prev;
                                return { ...prev, ...payload.new };
                            });
                        }
                    }
                )
                .subscribe();
            setRealtimeChannel(channel);
        };
        setupRealtime();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [realtimeIdRef]);

    const recordActivity = async (userId: string, tipo: string, descripcionPrefix: string, existingActivities?: any[]) => {
        try {
            const { supabase } = await import('../lib/supabase');
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('es-ES');

            const newActivity = {
                fechaHora: `${dateStr} ${timeStr}`,
                tipo: tipo,
                descripcion: `${descripcionPrefix} ${timeStr}.`
            };

            // Use passed activities if available (avoids extra SELECT round-trip)
            const currentActivities = existingActivities ?? [];
            const updatedActivities = [newActivity, ...currentActivities].slice(0, 50);

            await supabase.from('guards').update({ actividades: updatedActivities }).eq('idEmpleado', userId);
        } catch (error) {
            console.error('Error recording activity:', error);
        }
    };

    const login = async (userData: Guard) => {
        setUser(userData);
        try {
            const userAny = userData as any;
            const userId = userAny.idEmpleado || userAny.document_id || userAny.id || '';
            if (userId) {
                // Run status update and activity recording in parallel for speed
                const existingActivities = Array.isArray(userAny.actividades) ? userAny.actividades : [];
                await Promise.all([
                    updateGuardStatus(userId, 'En servicio'),
                    recordActivity(userId, 'INICIO DE TURNO', 'El guardia inició su turno a las', existingActivities)
                ]);

                // Track online status using Supabase Realtime Presence
                import('../lib/supabase').then(({ supabase }) => {
                    const channel = supabase.channel('online-guards-' + userId, {
                        config: { presence: { key: userId } }
                    });
                    channel.on('presence', { event: 'sync' }, () => { }).subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            await channel.track({ is_active: true, estado: 'En servicio' });
                        }
                    });
                    setPresenceChannel(channel);
                });
            }
        } catch (e) {
            console.error('Error updating status to En servicio upon login:', e);
        }
    };

    const logout = async () => {
        if (presenceChannel) {
            presenceChannel.unsubscribe();
            setPresenceChannel(null);
        }
        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            setRealtimeChannel(null);
        }
        if (user) {
            try {
                const userAny = user as any;
                const userId = userAny.idEmpleado || userAny.document_id || userAny.id || '';
                if (userId) {
                    const existingActivities = Array.isArray(userAny.actividades) ? userAny.actividades : [];
                    await Promise.all([
                        updateGuardStatus(userId, 'Fuera de servicio'),
                        recordActivity(userId, 'FIN DE TURNO', 'El guardia finalizó su turno a las', existingActivities)
                    ]);
                }
            } catch (e) {
                console.error('Error updating status to Fuera de servicio upon logout:', e);
            }
        }
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
