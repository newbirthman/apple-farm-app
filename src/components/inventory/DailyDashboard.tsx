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
        const summary: InventorySummary[] = prices.map((p: any) => ({
            category: p.category,
            itemName: p.itemName,
            totalIncoming: 0,
            totalSales: 0,
            currentStock: 0,
            stockValue: 0
        }));

        incoming.filter((i: any) => i.type === '판매대기').forEach((record: any) => {
            const target = summary.find(s => s.category === record.category && s.itemName === record.itemName);
            if (target) target.totalIncoming += record.quantity;
        });

        sales.forEach((record: any) => {
            const target = summary.find(s => s.category === record.category && s.itemName === record.itemName);
            if (target) target.totalSales += record.quantity;
        });

        return summary.map(s => {
            const currentStock = s.totalIncoming - s.totalSales;
            const unitPrice = prices.find((p: any) => p.category === s.category && p.itemName === s.itemName)?.price || 0;
            return {
                ...s,
                currentStock,
                stockValue: currentStock * unitPrice
            };
        }).filter(s => s.totalIncoming > 0 || s.totalSales > 0);

    }, [prices, incoming, sales]);

    const totalInventoryValue = inventorySummary.reduce((sum, item) => sum + item.stockValue, 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📦 전체 누적 재고 (포장완료/판매대기 제품)</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.subText }]}>※ 누적 입고량 - 누적 판매량 = 현재고</Text>

                <View style={[styles.bigBoxContainer, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.bigBoxLabel, { color: theme.colors.subText }]}>(미포장) 누적 큰 상자</Text>
                    <Text style={[styles.bigBoxValue, { color: theme.colors.text }]}>{totalBigBox.toLocaleString()} 🧺</Text>
                </View>

                {inventorySummary.length > 0 ? (
                    <View style={styles.table}>
                        <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', color: theme.colors.text }]}>품목</Text>
                            <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>잔여</Text>
                            <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>가치 (원)</Text>
                        </View>
                        {inventorySummary.map((item, idx) => (
                            <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                                <Text style={[styles.cell, { flex: 2, color: theme.colors.text }]}>{item.category} {item.itemName}</Text>
                                <Text style={[styles.cell, { flex: 1, textAlign: 'right', color: theme.colors.primary, fontWeight: 'bold' }]}>{item.currentStock}</Text>
                                <Text style={[styles.cell, { flex: 2, textAlign: 'right', color: theme.colors.text }]}>{item.stockValue.toLocaleString()}</Text>
                            </View>
                        ))}
                        <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: theme.colors.border, borderBottomWidth: 0, backgroundColor: theme.colors.background, marginTop: 4, paddingHorizontal: 8, borderRadius: 8 }]}>
                            <Text style={[styles.cell, { flex: 3, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>💰 총 자산 밸류 :</Text>
                            <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>{totalInventoryValue.toLocaleString()}</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.subText }]}>입고 내역이 존재하지 않아 재고를 산출할 수 없습니다.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 20 },
    card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    cardSubtitle: { fontSize: 12, marginBottom: 12 },
    bigBoxContainer: { padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
    bigBoxLabel: { fontSize: 12, marginBottom: 4 },
    bigBoxValue: { fontSize: 18, fontWeight: 'bold' },
    table: { marginTop: 8 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 8, marginBottom: 8 },
    tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, alignItems: 'center' },
    cell: { fontSize: 13 },
    emptyText: { textAlign: 'center', padding: 20, fontSize: 13 },
});
