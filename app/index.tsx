import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import WeatherWidget from '@/components/WeatherWidget';
import { useTheme } from '@/contexts/ThemeContext';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const inventoryHook = useInventory();
  const { sales, isLoading: isInvLoading } = inventoryHook;

  const [recentMemos, setRecentMemos] = useState<any[]>([]);
  const [todoCount, setTodoCount] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  // 오늘의 판매 합계 계산
  const todaySalesTotal = useMemo(() => {
    return sales
      .filter(s => s.date === todayStr)
      .reduce((sum, s) => sum + (s.totalPrice || 0), 0);
  }, [sales, todayStr]);

  // 재고 위험 품목 (잔고 10개 미만)
  const lowStockItems = useMemo(() => {
    const summaryMap: Record<string, number> = {};
    inventoryHook.incoming.filter(i => i.type === '판매대기').forEach(r => {
      const key = `${r.cropType || '사과'} ${r.category} ${r.itemName || ''}`;
      summaryMap[key] = (summaryMap[key] || 0) + r.quantity;
    });
    sales.forEach(s => {
      const key = `${s.cropType || '사과'} ${s.category} ${s.itemName || ''}`;
      if (summaryMap[key]) summaryMap[key] -= s.quantity;
    });
    return Object.entries(summaryMap)
      .filter(([_, qty]) => qty > 0 && qty < 10)
      .map(([name, qty]) => ({ name, qty }));
  }, [inventoryHook.incoming, sales]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsDataLoading(true);
        // 1. 최근 영농일지 2건
        const { data: memoData } = await supabase
          .from('memos')
          .select('*')
          .order('date', { ascending: false })
          .limit(2);

        // 2. 미완료 할일 개수
        const { count } = await supabase
          .from('todos')
          .select('*', { count: 'exact', head: true })
          .eq('done', false);

        if (memoData) setRecentMemos(memoData);
        setTodoCount(count || 0);
      } catch (err) {
        console.error('대시보드 데이터 로드 실패:', err);
      } finally {
        setIsDataLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (isInvLoading || isDataLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* 웰컴 헤더 */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>사장님, 반갑습니다! 👋</Text>
        <Text style={[styles.welcomeSubtext, { color: theme.colors.subText }]}>오늘 농장의 주요 현황을 확인하세요.</Text>
      </View>

      {/* 날씨/미세먼지 위젯 */}
      <WeatherWidget />

      {/* 대시보드 그리드 */}
      <View style={styles.dashboardGrid}>
        {/* 오늘의 판매 */}
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.statLabel, { color: theme.colors.subText }]}>💸 오늘의 판매</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{todaySalesTotal.toLocaleString()}원</Text>
        </View>

        {/* 할 일 현황 */}
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.statLabel, { color: theme.colors.subText }]}>✅ 미완료 할일</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{todoCount}건</Text>
        </View>
      </View>

      {/* 최근 영농일지 요약 */}
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🖋️ 최근 영농일지</Text>
        <View style={styles.memoList}>
          {recentMemos.length > 0 ? recentMemos.map((memo) => (
            <View key={memo.id} style={[styles.memoItem, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.memoDate, { color: theme.colors.primary }]}>{memo.date}</Text>
              <Text style={[styles.memoContent, { color: theme.colors.text }]} numberOfLines={1}>{memo.content}</Text>
            </View>
          )) : (
            <Text style={{ color: theme.colors.subText, fontSize: 13, fontStyle: 'italic' }}>기록된 일지가 없습니다.</Text>
          )}
        </View>
      </View>

      {/* 재고 경고 (부족 품목) */}
      {lowStockItems.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderLeftWidth: 4, borderLeftColor: '#f59e0b' }]}>
          <Text style={[styles.sectionTitle, { color: '#b45309' }]}>⚠️ 재고 부족 주의</Text>
          <View style={styles.stockWarningList}>
            {lowStockItems.map((item, idx) => (
              <View key={idx} style={styles.stockWarningItem}>
                <Text style={[styles.stockName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={[styles.stockQty, { color: '#dc2626' }]}>{item.qty}개 남음</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeSection: { marginBottom: 20, paddingHorizontal: 4 },
  welcomeText: { fontSize: 22, fontWeight: 'bold' },
  welcomeSubtext: { fontSize: 14, marginTop: 4 },
  dashboardGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '900' },
  sectionCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  memoList: { gap: 12 },
  memoItem: { paddingBottom: 8, borderBottomWidth: 1 },
  memoDate: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  memoContent: { fontSize: 14 },
  stockWarningList: { gap: 8 },
  stockWarningItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockName: { fontSize: 14, flex: 1 },
  stockQty: { fontSize: 14, fontWeight: 'bold' },
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
