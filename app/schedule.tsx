import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { seasons, getCurrentSeason } from '@/data/farmWorkflow';
import type { FarmTask, SeasonData, SeasonId } from '@/data/farmWorkflow';
import { useTheme } from '@/contexts/ThemeContext';

const urgencyBadge: Record<string, { bg: string; text: string; label: string }> = {
    '높음': { bg: '#fee2e2', text: '#dc2626', label: '🔴 긴급' },
    '보통': { bg: '#fef9c3', text: '#ca8a04', label: '🟡 보통' },
    '낮음': { bg: '#dcfce7', text: '#16a34a', label: '🟢 여유' },
};

const seasonColors: Record<SeasonId, { bg: string; accent: string; light: string; darkLight: string }> = {
    winter: { bg: '#3b82f6', accent: '#2563eb', light: '#eff6ff', darkLight: '#1e3a8a' },
    spring: { bg: '#ec4899', accent: '#db2777', light: '#fdf2f8', darkLight: '#831843' },
    summer: { bg: '#22c55e', accent: '#16a34a', light: '#f0fdf4', darkLight: '#14532d' },
    autumn: { bg: '#ef4444', accent: '#dc2626', light: '#fef2f2', darkLight: '#7f1d1d' },
};

function TaskCard({ task, color }: { task: FarmTask; color: typeof seasonColors.winter }) {
    const [isOpen, setIsOpen] = useState(false);
    const urgency = urgencyBadge[task.urgency];
    const { theme, isDarkMode } = useTheme();

    return (
        <View style={[styles.taskCard, { borderLeftColor: color.bg, borderLeftWidth: 4, backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)} activeOpacity={0.7}>
                <View style={styles.taskHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.taskTitleRow}>
                            <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                            <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                                <Text style={[styles.urgencyText, { color: urgency.text }]}>{urgency.label}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 12, color: theme.colors.subText, marginTop: 2 }}>📅 {task.period}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.colors.subText }}>{isOpen ? '▲' : '▼'}</Text>
                </View>
            </TouchableOpacity>

            {isOpen && (
                <View style={[styles.taskDetail, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.detailHeading, { color: theme.colors.text }]}>💡 효과적인 방법</Text>
                    {task.methods.map((m, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletIcon}>✅</Text>
                            <Text style={[styles.bulletText, { color: theme.colors.subText }]}>{m}</Text>
                        </View>
                    ))}

                    <Text style={[styles.detailHeading, { color: theme.colors.text, marginTop: 16 }]}>⚠️ 주의점</Text>
                    {task.cautions.map((c, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletIcon}>⚠️</Text>
                            <Text style={[styles.bulletText, { color: theme.colors.subText }]}>{c}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function ScheduleScreen() {
    const currentSeason = getCurrentSeason();
    const { theme, isDarkMode } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            <View style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>🍎 사과 농장 연간 작업 흐름</Text>
                <Text style={{ fontSize: 13, color: theme.colors.subText, marginTop: 4 }}>계절별 핵심 농작업을 한눈에 확인하세요</Text>
            </View>

            {seasons.map((season) => {
                const isCurrent = season.id === currentSeason;
                const color = seasonColors[season.id];

                return (
                    <View key={season.id} style={[styles.seasonBlock, { borderColor: theme.colors.border }]}>
                        {/* 시즌 헤더 */}
                        <View style={[styles.seasonHeader, { backgroundColor: color.bg }]}>
                            <Text style={styles.seasonEmoji}>{season.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <View style={styles.seasonTitleRow}>
                                    <Text style={styles.seasonName}>{season.name}</Text>
                                    <Text style={styles.seasonMonths}>
                                        {season.months.map(m => `${m}월`).join(' · ')}
                                    </Text>
                                </View>
                                {isCurrent && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>📌 현재 시즌</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* 작업 카드들 */}
                        <View style={[styles.tasksContainer, { backgroundColor: isDarkMode ? color.darkLight : color.light }]}>
                            {season.tasks.map(task => (
                                <TaskCard key={task.id} task={task} color={color} />
                            ))}
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    headerCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    seasonBlock: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    seasonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    seasonEmoji: { fontSize: 32 },
    seasonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    seasonName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    seasonMonths: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    currentBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
    currentBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    tasksContainer: { padding: 12 },
    taskCard: { borderRadius: 10, marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
    taskHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    taskTitle: { fontSize: 15, fontWeight: 'bold' },
    urgencyBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    urgencyText: { fontSize: 11, fontWeight: 'bold' },
    taskDetail: { padding: 14, borderTopWidth: 1 },
    detailHeading: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
    bulletIcon: { fontSize: 13, marginTop: 1 },
    bulletText: { fontSize: 13, flex: 1, lineHeight: 20 },
});
