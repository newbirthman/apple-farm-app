import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getCurrentSeason, getSeasonData } from '@/data/farmWorkflow';
import type { SeasonId } from '@/data/farmWorkflow';
import WeatherWidget from '@/components/WeatherWidget';
import { useTheme } from '@/contexts/ThemeContext';

const urgencyBadge: Record<string, { bg: string; text: string; label: string }> = {
  '높음': { bg: '#fee2e2', text: '#dc2626', label: '🔴 긴급' },
  '보통': { bg: '#fef9c3', text: '#ca8a04', label: '🟡 보통' },
  '낮음': { bg: '#dcfce7', text: '#16a34a', label: '🟢 여유' },
};

export default function HomeScreen() {
  const [currentSeason, setCurrentSeason] = useState<SeasonId>('spring');
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    setCurrentSeason(getCurrentSeason());
  }, []);

  const seasonData = getSeasonData(currentSeason);

  const seasonOrder: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];
  const nextIdx = (seasonOrder.indexOf(currentSeason) + 1) % 4;
  const nextSeason = getSeasonData(seasonOrder[nextIdx]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* 웰컴 헤더 */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>안녕하세요 사장님! 👋</Text>
        <Text style={[styles.welcomeSubtext, { color: theme.colors.subText }]}>오늘도 보람찬 하루 되세요.</Text>
      </View>

      {/* 날씨/미세먼지 위젯 (위젯 내부에서 별도 테마 대응) */}
      <WeatherWidget />

      {/* 현재 시즌 가이드 배너 */}
      <View style={[styles.mainCard, { backgroundColor: theme.colors.card, borderColor: isDarkMode ? theme.colors.borderDark : (seasonData.color === 'blue' ? '#93c5fd' : seasonData.color === 'pink' ? '#f9a8d4' : seasonData.color === 'green' ? '#86efac' : '#fca5a5') }]}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerEmoji}>{seasonData.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: isDarkMode ? theme.colors.primary : (seasonData.color === 'blue' ? '#1e40af' : seasonData.color === 'pink' ? '#9d174d' : seasonData.color === 'green' ? '#166534' : '#991b1b') }]}>
              {seasonData.name} 시즌 작업 가이드
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.colors.subText }]}>지금 시기에 집중해야 할 핵심 작업 {seasonData.tasks.length}가지</Text>
          </View>
        </View>

        {/* 현재 시즌 할 일 목록 */}
        <View style={[styles.taskList, { borderTopColor: theme.colors.border }]}>
          {seasonData.tasks.map((task, idx) => {
            const urgency = urgencyBadge[task.urgency];
            return (
              <View key={task.id} style={[styles.taskItem, { backgroundColor: isDarkMode ? theme.colors.tint : '#f8fafc', borderColor: theme.colors.border }]}>
                <View style={styles.taskTitleRow}>
                  <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                    <Text style={[styles.urgencyText, { color: urgency.text }]}>{urgency.label}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.subText }}>📅 {task.period}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 다음 시즌 미리보기 */}
      <View style={[styles.nextCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.nextCardTitle, { color: theme.colors.text }]}>📋 다음 시즌 미리보기</Text>
        <View style={[styles.nextContentBox, { backgroundColor: isDarkMode ? theme.colors.background : '#f3f4f6' }]}>
          <Text style={[styles.nextSeasonTitle, { color: theme.colors.text }]}>
            {nextSeason.emoji} {nextSeason.name} ({nextSeason.months.map(m => `${m}월`).join(' · ')})
          </Text>
          {nextSeason.tasks.map(task => (
            <View key={task.id} style={styles.nextTaskRow}>
              <View style={[styles.dot, { backgroundColor: theme.colors.subText }]} />
              <Text style={{ fontSize: 14, color: isDarkMode ? theme.colors.subText : '#4b5563' }}>{task.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  welcomeSection: { marginBottom: 20, paddingHorizontal: 4 },
  welcomeText: { fontSize: 22, fontWeight: 'bold' },
  welcomeSubtext: { fontSize: 14, marginTop: 4 },
  mainCard: { borderRadius: 16, padding: 20, borderWidth: 2, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold' },
  bannerSubtitle: { fontSize: 13, marginTop: 4 },
  taskList: { gap: 12, borderTopWidth: 1, paddingTop: 16 },
  taskItem: { padding: 12, borderRadius: 10, borderWidth: 1 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  taskTitle: { fontSize: 15, fontWeight: 'bold' },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  urgencyText: { fontSize: 11, fontWeight: 'bold' },
  nextCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  nextCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  nextContentBox: { borderRadius: 12, padding: 16 },
  nextSeasonTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  nextTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 }
});
