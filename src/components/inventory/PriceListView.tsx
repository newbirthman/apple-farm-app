import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import type { PriceItem, Category } from '@/types/inventory';

interface PriceListViewProps {
    prices: PriceItem[];
    updatePrice: (id: string, newPrice: number) => void;
}

export default function PriceListView({ prices, updatePrice }: PriceListViewProps) {
    const categories: Category[] = ['10kg', '5kg', '사과즙'];
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    const getItemsByCategory = (category: Category) => {
        return prices.filter(p => p.category === category);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <Text style={styles.headerTitle}>💰 기준 단가표 (Price List)</Text>
                <Text style={styles.headerSubtitle}>현재 설정된 기준 단가 리스트입니다. (합계 금액 및 판매 계산 시 자동 연동됩니다)</Text>
            </View>

            {categories.map(category => {
                const items = getItemsByCategory(category);
                if (items.length === 0) return null;

                return (
                    <View key={category} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>
                                {category === '10kg' || category === '5kg' ? '🍎' : '🧃'}
                                {category} 카테고리
                            </Text>
                        </View>
                        <View style={styles.table}>
                            {/* 테이블 헤더 */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>품목 이름</Text>
                                <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', textAlign: 'right' }]}>단가 (원)</Text>
                            </View>

                            {/* 테이블 바디 */}
                            {items.map(item => {
                                const isEditing = editingId === item.id;
                                return (
                                    <View key={item.id} style={styles.tableRow}>
                                        <Text style={[styles.cell, { flex: 1, fontWeight: '500' }]}>{item.itemName}</Text>

                                        <View style={[styles.cell, { flex: 1, alignItems: 'flex-end', justifyContent: 'center' }]}>
                                            {isEditing ? (
                                                <View style={styles.editContainer}>
                                                    <TextInput
                                                        style={styles.input}
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
                                                    <Text style={styles.priceText}>{item.price.toLocaleString()} 원</Text>
                                                    <TouchableOpacity
                                                        style={styles.editButton}
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
    headerCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderColor: '#e5e7eb', borderWidth: 1, marginBottom: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    card: { backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#e5e7eb', borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    cardHeader: { backgroundColor: '#f9fafb', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
    table: { paddingHorizontal: 16 },
    tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
    cell: { fontSize: 14, color: '#1f2937' },
    displayContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    priceText: { color: '#4b5563' },
    editButton: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    editText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold' },
    editContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, width: 80, fontSize: 14, textAlign: 'right' },
    iconButton: { padding: 4 },
    checkIcon: { fontSize: 14 },
    xIcon: { fontSize: 14 }
});
