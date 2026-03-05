import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { seasons, getCurrentSeason } from '@/data/farmWorkflow';
import type { FarmTask, SeasonData, SeasonId } from '@/data/farmWorkflow';

const urgencyBadge: Record<string, { bg: string; text: string; label: string }> = {
    '높음': { bg: '#fee2e2', text: '#dc2626', label: '🔴 긴급' },
    '보통': { bg: '#fef9c3', text: '#ca8a04', label: '🟡 보통' },
    '낮음': { bg: '#dcfce7', text: '#16a34a', label: '🟢 여유' },
};

const seasonColors: Record<SeasonId, { bg: string; accent: string; light: string }> = {
    winter: { bg: '#3b82f6', accent: '#2563eb', light: '#eff6ff' },
    spring: { bg: '#ec4899', accent: '#db2777', light: '#fdf2f8' },
    summer: { bg: '#22c55e', accent: '#16a34a', light: '#f0fdf4' },
    autumn: { bg: '#ef4444', accent: '#dc2626', light: '#fef2f2' },
};

function TaskCard({ task, color }: { task: FarmTask; color: typeof seasonColors.winter }) {
    const [isOpen, setIsOpen] = useState(false);
    const urgency = urgencyBadge[task.urgency];

    return (
        <View style={[styles.taskCard, { borderLeftColor: color.bg, borderLeftWidth: 4 }]}>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)} activeOpacity={0.7}>
                <View style={styles.taskHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.taskTitleRow}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                                <Text style={[styles.urgencyText, { color: urgency.text }]}>{urgency.label}</Text>
                            </View>
                        </View>
                        <Text style={styles.taskPeriod}>📅 {task.period}</Text>
                    </View>
                    <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                </View>
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.taskDetail}>
                    <Text style={styles.detailHeading}>💡 효과적인 방법</Text>
                    {task.methods.map((m, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletIcon}>✅</Text>
                            <Text style={styles.bulletText}>{m}</Text>
                        </View>
                    ))}

                    <Text style={[styles.detailHeading, { marginTop: 16 }]}>⚠️ 주의점</Text>
                    {task.cautions.map((c, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletIcon}>⚠️</Text>
                            <Text style={styles.bulletText}>{c}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function ScheduleScreen() {
    const currentSeason = getCurrentSeason();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <Text style={styles.headerTitle}>🍎 사과 농장 연간 작업 흐름</Text>
                <Text style={styles.headerSubtitle}>계절별 핵심 농작업을 한눈에 확인하세요</Text>
            </View>

            {seasons.map((season) => {
                const isCurrent = season.id === currentSeason;
                const color = seasonColors[season.id];

                return (
                    <View key={season.id} style={styles.seasonBlock}>
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
                        <View style={[styles.tasksContainer, { backgroundColor: color.light }]}>
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
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { padding: 16, paddingBottom: 32 },
    headerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    seasonBlock: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
    seasonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    seasonEmoji: { fontSize: 32 },
    seasonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    seasonName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    seasonMonths: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    currentBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
    currentBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    tasksContainer: { padding: 12 },
    taskCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
    taskHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
    taskPeriod: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    urgencyBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    urgencyText: { fontSize: 11, fontWeight: 'bold' },
    chevron: { fontSize: 12, color: '#9ca3af' },
    taskDetail: { padding: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    detailHeading: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
    bulletIcon: { fontSize: 13, marginTop: 1 },
    bulletText: { fontSize: 13, color: '#4b5563', flex: 1, lineHeight: 20 },
});
