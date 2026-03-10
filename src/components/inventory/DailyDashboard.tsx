import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { InventorySummary } from '@/types/inventory';
import { useTheme } from '@/contexts/ThemeContext';

export default function DailyDashboard({ inventoryHook }: { inventoryHook: any }) {
    const { prices, incoming, sales } = inventoryHook;
    const selectedDate = new Date().toISOString().split('T')[0];
    const { theme, isDarkMode } = useTheme();

    const totalBigBox = useMemo(() => {
        return incoming.filter((i: any) => i.type === '큰상자').reduce((sum: number, item: any) => sum + item.quantity, 0);
    }, [incoming]);

    const inventorySummary = useMemo(() => {
        // 실제 입고/판매 데이터 기반으로 품목, 포장상태, 분류, 品목명을 추출합니다.
        const summaryMap: Record<string, InventorySummary> = {};

        incoming.filter((i: any) => i.type === '판매대기').forEach((record: any) => {
            const rCrop = record.cropType || '사과';
            const rPack = record.packagingStatus || '미포장';
            const key = `${rCrop}_${rPack}_${record.category}_${record.itemName}`;

            if (!summaryMap[key]) {
                summaryMap[key] = {
                    cropType: rCrop,
                    packagingStatus: rPack as any,
                    category: record.category,
                    itemName: record.itemName,
                    totalIncoming: 0,
                    totalSales: 0,
                    currentStock: 0,
                    stockValue: 0
                };
            }
            summaryMap[key].totalIncoming += record.quantity;
        });

        sales.forEach((record: any) => {
            const rCrop = record.cropType || '사과';
            // 판매 레코드에는 현재 packagingStatus가 없으므로 (기존 DB) 미포장을 기본으로 세팅합니다.
            // 향후 판매 데이터에도 packaging_status가 확장될 수 있으나 현재는 매핑 가능한 만큼 차감합니다.
            const rPack = record.packagingStatus || '미포장';
            const key = `${rCrop}_${rPack}_${record.category}_${record.itemName}`;

            if (summaryMap[key]) {
                summaryMap[key].totalSales += record.quantity;
            }
        });

        return Object.values(summaryMap).map(s => {
            const currentStock = s.totalIncoming - s.totalSales;
            const unitPrice = prices.find((p: any) => (p.cropType || '사과') === s.cropType && p.category === s.category && p.itemName === s.itemName)?.price || 0;
            return {
                ...s,
                currentStock,
                stockValue: currentStock * unitPrice
            };
        }).filter(s => s.currentStock > 0); // 잔고가 1 이상인 것만 표출

    }, [prices, incoming, sales]);

    // 그룹화 로직: 품목(cropType) -> 포장상태(packagingStatus)
    const groupedSummary = useMemo(() => {
        const groups: Record<string, Record<string, InventorySummary[]>> = {};

        inventorySummary.forEach(item => {
            const crop = item.cropType;
            const pack = item.packagingStatus || '미포장';

            if (!groups[crop]) groups[crop] = {};
            if (!groups[crop][pack]) groups[crop][pack] = [];

            groups[crop][pack].push(item);
        });
        return groups;
    }, [inventorySummary]);

    const totalInventoryValue = inventorySummary.reduce((sum, item) => sum + item.stockValue, 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                {/* 1. 최상단: 총 재고 금액 노출 */}
                <View style={[styles.totalValueBox, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.totalValueLabel, { color: '#ffffff' }]}>💰 총 재고 금액</Text>
                    <Text style={[styles.totalValueText, { color: '#ffffff' }]}>{totalInventoryValue.toLocaleString()} 원</Text>
                </View>


                {/* 3. 그룹별 테이블 렌더링 */}
                {Object.keys(groupedSummary).length > 0 ? (
                    Object.keys(groupedSummary).map((crop) => (
                        <View key={crop} style={{ marginTop: 24 }}>
                            {/* 대분류 (품목명) 타이틀 */}
                            <Text style={[styles.cropTitle, { color: theme.colors.text }]}>🌱 {crop}</Text>

                            {Object.keys(groupedSummary[crop]).map((pack) => (
                                <View key={pack} style={[styles.tableBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                                    {/* 소분류 (포장상태) 타이틀 */}
                                    <View style={[styles.packTitleBox, { borderBottomColor: theme.colors.border }]}>
                                        <Text style={[styles.packTitle, { color: theme.colors.primary }]}>📦 {pack}</Text>
                                    </View>

                                    {/* 커스텀 테이블 헤더 (중량, 개수, 잔여, 금액) */}
                                    <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
                                        <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', color: theme.colors.text }]}>중량(단위)</Text>
                                        <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', color: theme.colors.text }]}>개수(품명)</Text>
                                        <Text style={[styles.cell, { flex: 1.2, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>잔여</Text>
                                        <Text style={[styles.cell, { flex: 2.5, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>금액(원)</Text>
                                    </View>

                                    {/* 데이터 로우 */}
                                    {groupedSummary[crop][pack].map((item, idx) => (
                                        <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                                            <Text style={[styles.cell, { flex: 2, color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">{item.category}</Text>
                                            <Text style={[styles.cell, { flex: 2, color: theme.colors.subText }]} numberOfLines={1} ellipsizeMode="tail">{item.itemName}</Text>
                                            <Text style={[styles.cell, { flex: 1.2, textAlign: 'right', color: theme.colors.primary, fontWeight: 'bold' }]}>{item.currentStock}</Text>
                                            <Text style={[styles.cell, { flex: 2.5, textAlign: 'right', color: theme.colors.text }]}>{item.stockValue.toLocaleString()}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.subText, marginTop: 24 }]}>현재고가 남은 물품 내역이 없습니다.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 20 },
    card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },

    totalValueBox: { borderRadius: 10, padding: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    totalValueLabel: { fontSize: 13, fontWeight: 'bold', opacity: 0.9, marginBottom: 4 },
    totalValueText: { fontSize: 26, fontWeight: '900' },

    cropTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, marginLeft: 4 },
    tableBlock: { borderWidth: 1, borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
    packTitleBox: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
    packTitle: { fontSize: 14, fontWeight: 'bold' },

    bigBoxContainer: { padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    bigBoxLabel: { fontSize: 12, marginBottom: 4 },
    bigBoxValue: { fontSize: 18, fontWeight: 'bold' },

    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.02)' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: 'center' },
    cell: { fontSize: 13 },
    emptyText: { textAlign: 'center', padding: 20, fontSize: 13 },
});
