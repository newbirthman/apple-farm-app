import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getCurrentSeason, getSeasonData } from '@/data/farmWorkflow';
import type { SeasonId } from '@/data/farmWorkflow';

const urgencyBadge: Record<string, { bg: string; text: string; label: string }> = {
  '높음': { bg: '#fee2e2', text: '#dc2626', label: '🔴 긴급' },
  '보통': { bg: '#fef9c3', text: '#ca8a04', label: '🟡 보통' },
  '낮음': { bg: '#dcfce7', text: '#16a34a', label: '🟢 여유' },
};

export default function HomeScreen() {
  const [currentSeason, setCurrentSeason] = useState<SeasonId>('spring');
  
  useEffect(() => {
    setCurrentSeason(getCurrentSeason());
  }, []);

  const seasonData = getSeasonData(currentSeason);
  
  const seasonOrder: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];
  const nextIdx = (seasonOrder.indexOf(currentSeason) + 1) % 4;
  const nextSeason = getSeasonData(seasonOrder[nextIdx]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 웰컴 헤더 */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>안녕하세요 사장님! 👋</Text>
        <Text style={styles.welcomeSubtext}>오늘도 보람찬 하루 되세요.</Text>
      </View>

      {/* 현재 시즌 가이드 배너 */}
      <View style={[styles.mainCard, { borderColor: seasonData.color === 'blue' ? '#93c5fd' : seasonData.color === 'pink' ? '#f9a8d4' : seasonData.color === 'green' ? '#86efac' : '#fca5a5' }]}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerEmoji}>{seasonData.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: seasonData.color === 'blue' ? '#1e40af' : seasonData.color === 'pink' ? '#9d174d' : seasonData.color === 'green' ? '#166534' : '#991b1b' }]}>
              {seasonData.name} 시즌 작업 가이드
            </Text>
            <Text style={styles.bannerSubtitle}>지금 시기에 집중해야 할 핵심 작업 {seasonData.tasks.length}가지</Text>
          </View>
        </View>

        {/* 현재 시즌 할 일 목록 */}
        <View style={styles.taskList}>
          {seasonData.tasks.map((task, idx) => {
            const urgency = urgencyBadge[task.urgency];
            return (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskTitleRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                    <Text style={[styles.urgencyText, { color: urgency.text }]}>{urgency.label}</Text>
                  </View>
                </View>
                <Text style={styles.taskPeriod}>📅 {task.period}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 다음 시즌 미리보기 */}
      <View style={styles.nextCard}>
        <Text style={styles.nextCardTitle}>📋 다음 시즌 미리보기</Text>
        <View style={styles.nextContentBox}>
          <Text style={styles.nextSeasonTitle}>
            {nextSeason.emoji} {nextSeason.name} ({nextSeason.months.map(m => `${m}월`).join(' · ')})
          </Text>
          {nextSeason.tasks.map(task => (
            <View key={task.id} style={styles.nextTaskRow}>
              <View style={styles.dot} />
              <Text style={styles.nextTaskText}>{task.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  welcomeSection: { marginBottom: 20, paddingHorizontal: 4 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  welcomeSubtext: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  mainCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 2, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold' },
  bannerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  taskList: { gap: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16 },
  taskItem: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  urgencyText: { fontSize: 11, fontWeight: 'bold' },
  taskPeriod: { fontSize: 12, color: '#64748b' },
  nextCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  nextCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  nextContentBox: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16 },
  nextSeasonTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  nextTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9ca3af' },
  nextTaskText: { fontSize: 14, color: '#4b5563' }
});
