import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Pressable,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './theme/ThemeContext';
import { useUser } from './context/UserContext';
import { supabase } from './lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type EntryRecord = {
    id: string;
    fecha: string;
    tipo: 'entrada' | 'salida';
    hora: string;
    ubicacion?: string;
};

type DayGroup = {
    label: string;       // "Lunes 09/03"
    dateKey: string;     // "2026-03-09"
    entries: EntryRecord[];
    totalHoras: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Devuelve el lunes de la semana de una fecha dada */
const getMondayOf = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = dom
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const toDateKey = (date: Date): string =>
    date.toISOString().split('T')[0];

const formatDateLabel = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${days[date.getDay()]} ${d}/${m}`;
};

const calcHoras = (entries: EntryRecord[]): string => {
    const entradas = entries.filter(e => e.tipo === 'entrada').map(e => e.hora);
    const salidas = entries.filter(e => e.tipo === 'salida').map(e => e.hora);
    if (entradas.length === 0 || salidas.length === 0) return '—';

    const toMin = (h: string) => {
        const [hh, mm] = h.split(':').map(Number);
        return hh * 60 + mm;
    };

    let total = 0;
    entradas.forEach((en, i) => {
        if (salidas[i]) {
            const diff = toMin(salidas[i]) - toMin(en);
            if (diff > 0) total += diff;
        }
    });

    if (total === 0) return '—';
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${hh}h ${mm.toString().padStart(2, '0')}m`;
};

// ─── Constantes de colores ────────────────────────────────────────────────────
const BLUE = '#3b82f6';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';

// ─── Componente principal ─────────────────────────────────────────────────────
const WeeklyRecordScreen = () => {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();
    const { user } = useUser();

    const [weekOffset, setWeekOffset] = useState(0);  // 0 = semana actual, -1 = anterior…
    const [groups, setGroups] = useState<DayGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calcular fechas de la semana actual + offset
    const monday = getMondayOf(addDays(new Date(), weekOffset * 7));
    const sunday = addDays(monday, 6);

    const weekLabel = (() => {
        const fmt = (d: Date) =>
            `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        return `${fmt(monday)} – ${fmt(sunday)}`;
    })();

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const guardId = user?.idEmpleado || user?.document_id;
        if (!guardId) {
            setError('No se pudo identificar al guardia.');
            setLoading(false);
            return;
        }

        const fromDate = toDateKey(monday);
        const toDate = toDateKey(sunday);

        try {
            const { data, error: dbErr } = await supabase
                .from('entries_exits')
                .select('id, fechaHora, tipo, descripcion')
                // .eq('guard_id', guardId) // Removed for testing, assuming 'idRelacionado' might be guard_id
                .gte('fechaHora', `${fromDate}T00:00:00`)
                .lte('fechaHora', `${toDate}T23:59:59`)
                .order('fechaHora', { ascending: true });

            if (dbErr) throw dbErr;

            // Construir los 7 días de la semana
            const dayGroups: DayGroup[] = [];
            for (let i = 0; i < 7; i++) {
                const day = addDays(monday, i);
                const dateKey = toDateKey(day);

                const dayEntries: EntryRecord[] = (data || [])
                    .filter(row => row.fechaHora && row.fechaHora.startsWith(dateKey))
                    .map(row => ({
                        id: row.id,
                        fecha: dateKey,
                        tipo: row.tipo?.toLowerCase() === 'entrada' ? 'entrada' : 'salida',
                        hora: new Date(row.fechaHora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                        ubicacion: row.descripcion,
                    }));

                dayGroups.push({
                    label: formatDateLabel(day),
                    dateKey,
                    entries: dayEntries,
                    totalHoras: calcHoras(dayEntries),
                });
            }

            setGroups(dayGroups);
        } catch (e: any) {
            setError('Error al cargar el registro. Intenta de nuevo.');
            console.error('WeeklyRecord error:', e);
        } finally {
            setLoading(false);
        }
    }, [weekOffset, user]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Estilos dinámicos ─────────────────────────────────────────────────────
    const dyn = StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
        weekNav: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        weekLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
        navBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dayCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            marginHorizontal: 16,
            marginTop: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
        },
        dayHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        dayLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
        horasTag: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
        },
        horasText: { fontSize: 12, fontWeight: '700', color: GREEN, marginLeft: 4 },
        emptyDay: {
            paddingVertical: 14,
            alignItems: 'center',
        },
        emptyDayText: { fontSize: 13, color: colors.subtext },
        entryRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        entryDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginRight: 12,
        },
        entryTipo: { fontSize: 13, fontWeight: '600', color: colors.text, width: 70 },
        entryHora: { fontSize: 13, color: colors.subtext, flex: 1 },
        entryLoc: { fontSize: 12, color: colors.subtext },
        summaryCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            marginHorizontal: 16,
            marginTop: 18,
            marginBottom: 8,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-around',
        },
        statBox: { alignItems: 'center' },
        statNum: { fontSize: 24, fontWeight: '800', color: BLUE },
        statLabel: { fontSize: 12, color: colors.subtext, marginTop: 2 },
    });

    // ─── Totales semanales ─────────────────────────────────────────────────────
    const totalEntradas = groups.reduce((acc, g) => acc + g.entries.filter(e => e.tipo === 'entrada').length, 0);
    const diasConMov = groups.filter(g => g.entries.length > 0).length;

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={dyn.safeArea}>
            {/* Header */}
            <View style={dyn.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={dyn.headerTitle}>Registro Semanal</Text>
                <TouchableOpacity onPress={loadData} style={{ padding: 4 }}>
                    <Ionicons name="refresh-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Navegación de semana */}
            <View style={dyn.weekNav}>
                <TouchableOpacity style={dyn.navBtn} onPress={() => setWeekOffset(v => v - 1)}>
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={dyn.weekLabel}>{weekLabel}</Text>
                    {weekOffset !== 0 && (
                        <TouchableOpacity onPress={() => setWeekOffset(0)}>
                            <Text style={{ fontSize: 11, color: BLUE, marginTop: 2 }}>Semana actual</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[dyn.navBtn, weekOffset >= 0 && { opacity: 0.3 }]}
                    onPress={() => { if (weekOffset < 0) setWeekOffset(v => v + 1); }}
                    disabled={weekOffset >= 0}
                >
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Contenido */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={BLUE} />
                    <Text style={{ color: colors.subtext, marginTop: 12 }}>Cargando registro…</Text>
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.subtext} />
                    <Text style={{ color: colors.subtext, marginTop: 12, textAlign: 'center' }}>{error}</Text>
                    <TouchableOpacity onPress={loadData} style={{ marginTop: 16, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>

                    {/* Resumen semanal */}
                    <View style={dyn.summaryCard}>
                        <View style={dyn.statBox}>
                            <Text style={dyn.statNum}>{totalEntradas}</Text>
                            <Text style={dyn.statLabel}>Registros</Text>
                        </View>
                        <View style={[dyn.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border, paddingHorizontal: 24 }]}>
                            <Text style={[dyn.statNum, { color: GREEN }]}>{diasConMov}</Text>
                            <Text style={dyn.statLabel}>Días activos</Text>
                        </View>
                        <View style={dyn.statBox}>
                            <Text style={[dyn.statNum, { color: AMBER }]}>{7 - diasConMov}</Text>
                            <Text style={dyn.statLabel}>Días sin mov.</Text>
                        </View>
                    </View>

                    {/* Tarjetas por día */}
                    {groups.map(day => (
                        <View key={day.dateKey} style={dyn.dayCard}>
                            <View style={dyn.dayHeader}>
                                <Text style={dyn.dayLabel}>{day.label}</Text>
                                {day.entries.length > 0 ? (
                                    <View style={dyn.horasTag}>
                                        <Ionicons name="time-outline" size={13} color={GREEN} />
                                        <Text style={dyn.horasText}>{day.totalHoras}</Text>
                                    </View>
                                ) : (
                                    <View style={[dyn.horasTag, { backgroundColor: isDarkMode ? 'rgba(100,116,139,0.15)' : 'rgba(100,116,139,0.1)' }]}>
                                        <Text style={[dyn.horasText, { color: colors.subtext }]}>Sin registro</Text>
                                    </View>
                                )}
                            </View>

                            {day.entries.length === 0 ? (
                                <View style={dyn.emptyDay}>
                                    <Text style={dyn.emptyDayText}>— Sin movimientos —</Text>
                                </View>
                            ) : (
                                day.entries.map((entry, idx) => (
                                    <View
                                        key={entry.id}
                                        style={[
                                            dyn.entryRow,
                                            idx === day.entries.length - 1 && { borderBottomWidth: 0 },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                dyn.entryDot,
                                                { backgroundColor: entry.tipo === 'entrada' ? GREEN : '#ef4444' },
                                            ]}
                                        />
                                        <Text style={dyn.entryTipo}>
                                            {entry.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                                        </Text>
                                        <Text style={dyn.entryHora}>{entry.hora}</Text>
                                        {entry.ubicacion && (
                                            <Text style={dyn.entryLoc} numberOfLines={1}>{entry.ubicacion}</Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default WeeklyRecordScreen;
