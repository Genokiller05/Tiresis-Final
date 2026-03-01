import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { useUser } from './context/UserContext';
import type { GuardNotification, NotificationType } from './types/supabase';
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
} from './services/notificationService';

const ICON_MAP: Record<NotificationType, { name: string; color: string }> = {
    area_change: { name: 'map-outline', color: '#3b82f6' },
    shift_start: { name: 'sunny-outline', color: '#22c55e' },
    shift_end: { name: 'moon-outline', color: '#a855f7' },
    general: { name: 'notifications-outline', color: '#f59e0b' },
};

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();
    const { t } = useI18n();
    const { user } = useUser();

    const [notifications, setNotifications] = useState<GuardNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const guardId = user?.idEmpleado || '';

    const loadNotifications = useCallback(async () => {
        if (!guardId) return;
        const data = await fetchNotifications(guardId);
        setNotifications(data);
        setLoading(false);
    }, [guardId]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Suscripción en tiempo real
    useEffect(() => {
        if (!guardId) return;
        const unsubscribe = subscribeToNotifications(guardId, (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
        });
        return unsubscribe;
    }, [guardId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead(guardId);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return t('notifications.just_now');
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    const renderItem = ({ item }: { item: GuardNotification }) => {
        const iconInfo = ICON_MAP[item.type] || ICON_MAP.general;

        return (
            <Pressable
                onPress={() => !item.is_read && handleMarkAsRead(item.id)}
                style={[
                    styles.notifCard,
                    {
                        backgroundColor: item.is_read
                            ? colors.card
                            : isDarkMode
                                ? 'rgba(59, 130, 246, 0.08)'
                                : 'rgba(59, 130, 246, 0.06)',
                        borderColor: item.is_read ? colors.border : iconInfo.color + '40',
                    },
                ]}
            >
                {/* Unread dot */}
                {!item.is_read && (
                    <View style={[styles.unreadDot, { backgroundColor: iconInfo.color }]} />
                )}

                {/* Icon */}
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: iconInfo.color + '18' },
                    ]}
                >
                    <Ionicons
                        name={iconInfo.name as any}
                        size={22}
                        color={iconInfo.color}
                    />
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <Text
                            style={[
                                styles.notifTitle,
                                { color: colors.text, fontWeight: item.is_read ? '500' : '700' },
                            ]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.subtext }]}>
                            {formatTime(item.created_at)}
                        </Text>
                    </View>
                    <Text
                        style={[styles.notifBody, { color: colors.subtext }]}
                        numberOfLines={2}
                    >
                        {item.body}
                    </Text>
                </View>
            </Pressable>
        );
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {t('notifications.title')}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Unread count + Mark all */}
                {unreadCount > 0 && (
                    <View style={styles.actionBar}>
                        <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.badgeText}>
                                {unreadCount} {t('notifications.unread')}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleMarkAllAsRead}>
                            <Text style={[styles.markAllText, { color: colors.accent }]}>
                                {t('notifications.mark_all_read')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* List */}
                {loading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.centerContent}>
                        <Ionicons
                            name="notifications-off-outline"
                            size={64}
                            color={colors.subtext}
                        />
                        <Text style={[styles.emptyText, { color: colors.subtext }]}>
                            {t('notifications.no_notifications')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    markAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
        position: 'relative',
    },
    unreadDot: {
        position: 'absolute',
        top: 14,
        left: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 15,
        flex: 1,
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
    },
    notifBody: {
        fontSize: 13,
        lineHeight: 18,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
    },
});

export default NotificationsScreen;
