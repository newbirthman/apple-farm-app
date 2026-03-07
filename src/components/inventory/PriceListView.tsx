import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import type { PriceItem, Category } from '@/types/inventory';
import { useTheme } from '@/contexts/ThemeContext';

interface PriceListViewProps {
    prices: PriceItem[];
    updatePrice: (id: string, newPrice: number) => void;
}

export default function PriceListView({ prices, updatePrice }: PriceListViewProps) {
    const categories: Category[] = ['10kg', '5kg', '사과즙'];
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    const { theme, isDarkMode } = useTheme();

    const getItemsByCategory = (category: Category) => {
        return prices.filter(p => p.category === category);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>💰 기준 단가표 (Price List)</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.subText }]}>현재 설정된 기준 단가 리스트입니다. (합계 금액 및 판매 계산 시 자동 연동됩니다)</Text>
            </View>

            {categories.map(category => {
                const items = getItemsByCategory(category);
                if (items.length === 0) return null;

                return (
                    <View key={category} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <View style={[styles.cardHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                {category === '10kg' || category === '5kg' ? '🍎' : '🧃'}
                                {category} 카테고리
                            </Text>
                        </View>
                        <View style={styles.table}>
                            {/* 테이블 헤더 */}
                            <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
                                <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', color: theme.colors.text }]}>품목 이름</Text>
                                <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>단가 (원)</Text>
                            </View>

                            {/* 테이블 바디 */}
                            {items.map(item => {
                                const isEditing = editingId === item.id;
                                return (
                                    <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                                        <Text style={[styles.cell, { flex: 1, fontWeight: '500', color: theme.colors.text }]}>{item.itemName}</Text>

                                        <View style={[styles.cell, { flex: 1, alignItems: 'flex-end', justifyContent: 'center' }]}>
                                            {isEditing ? (
                                                <View style={styles.editContainer}>
                                                    <TextInput
                                                        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                                        value={editPrice}
                                                        onChangeText={setEditPrice}
                                                        keyboardType="numeric"
                                                    />
                                                    <TouchableOpacity
                                                        style={styles.iconButton}
                                                        onPress={() => {
                                                            const num = parseInt(editPrice, 10);
                                                            if (num >= 0) {
                                                                updatePrice(item.id, num);
                                                                setEditingId(null);
                                                            }
                                                        }}
                                                    >
                                                        <Text style={styles.checkIcon}>✅</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.iconButton}
                                                        onPress={() => setEditingId(null)}
                                                    >
                                                        <Text style={styles.xIcon}>❌</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <View style={styles.displayContainer}>
                                                    <Text style={[styles.priceText, { color: theme.colors.subText }]}>{item.price.toLocaleString()} 원</Text>
                                                    <TouchableOpacity
                                                        style={[styles.editButton, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}
                                                        onPress={() => {
                                                            setEditingId(item.id);
                                                            setEditPrice(item.price.toString());
                                                        }}
                                                    >
                                                        <Text style={styles.editText}>수정</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 20 },
    headerCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 13, marginTop: 4 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    cardHeader: { padding: 12, borderBottomWidth: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold' },
    table: { paddingHorizontal: 16 },
    tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, alignItems: 'center' },
    cell: { fontSize: 14 },
    displayContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    priceText: {},
    editButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    editText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold' },
    editContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    input: { borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, width: 80, fontSize: 14, textAlign: 'right' },
    iconButton: { padding: 4 },
    checkIcon: { fontSize: 14 },
    xIcon: { fontSize: 14 }
});
