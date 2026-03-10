import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import type { PriceItem } from '@/types/inventory';
import { useTheme } from '@/contexts/ThemeContext';

interface PriceListViewProps {
    prices: PriceItem[];
    deliveryFee: number;
    updateDeliveryFee: (fee: number) => void;
    updatePrice: (id: string, newPrice: number) => void;
    deletePriceItem: (id: string) => void;
}

export default function PriceListView({ prices, deliveryFee, updateDeliveryFee, updatePrice, deletePriceItem }: PriceListViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');
    const [feeInput, setFeeInput] = useState<string>(String(deliveryFee || 0));
    const [isEditingFee, setIsEditingFee] = useState(false);
    const { theme, isDarkMode } = useTheme();

    // 1단계: 품목(cropType) 목록 추출
    const cropTypes = Array.from(new Set(prices.map(p => p.cropType || '사과')));

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>💰 기준 단가표 (Price List)</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.subText }]}>현재 설정된 기준 단가 리스트입니다. (합계 금액 및 판매 계산 시 자동 연동됩니다)</Text>
            </View>

            {/* 글로벌 택배비 설정 (테이블 외부) */}
            <View style={[styles.feeCard, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.08)' : '#eff6ff', borderColor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe' }]}>
                <Text style={[styles.feeTitle, { color: theme.colors.text }]}>🚚 택배비 기본 요금 설정</Text>
                <Text style={[styles.feeDesc, { color: theme.colors.subText }]}>이 금액은 택배 칼럼의 모든 단가에 합산됩니다.</Text>
                <View style={styles.feeRow}>
                    {isEditingFee ? (
                        <View style={styles.feeEditRow}>
                            <TextInput
                                style={[styles.feeInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                value={feeInput}
                                onChangeText={setFeeInput}
                                keyboardType="numeric"
                                autoFocus
                            />
                            <Text style={{ color: theme.colors.subText, marginLeft: 4, fontSize: 14 }}>원</Text>
                            <TouchableOpacity
                                style={[styles.feeBtn, { backgroundColor: theme.colors.primary, marginLeft: 10 }]}
                                onPress={() => {
                                    const num = parseInt(feeInput, 10);
                                    if (!isNaN(num) && num >= 0) {
                                        updateDeliveryFee(num);
                                        setIsEditingFee(false);
                                    }
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>저장</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.feeBtn, { backgroundColor: isDarkMode ? '#555' : '#e5e7eb', marginLeft: 6 }]}
                                onPress={() => {
                                    setFeeInput(String(deliveryFee));
                                    setIsEditingFee(false);
                                }}
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 13 }}>취소</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.feeDisplayRow} onPress={() => { setFeeInput(String(deliveryFee)); setIsEditingFee(true); }}>
                            <Text style={[styles.feeValue, { color: theme.colors.primary }]}>💵 {deliveryFee.toLocaleString()} 원</Text>
                            <Text style={[styles.feeEditLabel, { color: '#2563eb' }]}>수정</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {cropTypes.map(crop => {
                // 해당 품목에 속하는 아이템들
                const cropItems = prices.filter(p => (p.cropType || '사과') === crop);
                // 2단계: 그 품목 안에서의 분류(중량/단위) 추출
                const categories = Array.from(new Set(cropItems.map(p => p.category)));

                return (
                    <View key={crop} style={{ marginBottom: 24 }}>
                        <Text style={[styles.cropTitle, { color: theme.colors.primary }]}>🌱 {crop}</Text>

                        {categories.map(category => {
                            const items = cropItems.filter(p => p.category === category);
                            if (items.length === 0) return null;

                            return (
                                <View key={category} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📦 {category} 기준</Text>
                                    </View>
                                    <View style={styles.table}>
                                        {/* 테이블 헤더 - 3칼럼: 분류 | 도/소매 | 택배 */}
                                        <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
                                            <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', color: theme.colors.text }]}>분류</Text>
                                            <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', textAlign: 'right', color: theme.colors.text }]}>도/소매</Text>
                                            <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', textAlign: 'right', color: '#2563eb' }]}>택배</Text>
                                        </View>

                                        {/* 테이블 바디 */}
                                        {items.map(item => {
                                            const isEditing = editingId === item.id;
                                            const deliveryPrice = item.price + deliveryFee;

                                            const handleDelete = () => {
                                                Alert.alert(
                                                    "단가표 삭제",
                                                    `정말 [${item.itemName}] 항목을 삭제하시겠습니까?`,
                                                    [
                                                        { text: "취소", style: "cancel" },
                                                        {
                                                            text: "삭제",
                                                            style: "destructive",
                                                            onPress: () => deletePriceItem(item.id)
                                                        }
                                                    ]
                                                );
                                            };

                                            return (
                                                <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
                                                    {/* 분류명 */}
                                                    <Text style={[styles.cell, { flex: 1, fontWeight: '500', color: theme.colors.text }]}>{item.itemName || '기본'}</Text>

                                                    {/* 도/소매 칼럼 (기존 단가) */}
                                                    <View style={[styles.cell, { flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end', flexDirection: 'row' }]}>
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
                                                                <Text style={[styles.priceText, { color: theme.colors.subText }]}>{item.price.toLocaleString()}</Text>
                                                                <TouchableOpacity
                                                                    style={[styles.editButton, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}
                                                                    onPress={() => {
                                                                        setEditingId(item.id);
                                                                        setEditPrice(item.price.toString());
                                                                    }}
                                                                >
                                                                    <Text style={styles.editText}>수정</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    style={[styles.deleteButton, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}
                                                                    onPress={handleDelete}
                                                                >
                                                                    <Text style={styles.deleteText}>삭제</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* 택배 칼럼 (도소매 + 글로벌 택배비 합산) */}
                                                    <Text style={[styles.cell, { flex: 1, textAlign: 'right', color: '#2563eb', fontWeight: 'bold' }]}>{deliveryPrice.toLocaleString()}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
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
    feeCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 20 },
    feeTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    feeDesc: { fontSize: 12, marginBottom: 10 },
    feeRow: {},
    feeEditRow: { flexDirection: 'row', alignItems: 'center' },
    feeInput: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, width: 120, fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
    feeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    feeDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    feeValue: { fontSize: 20, fontWeight: 'bold' },
    feeEditLabel: { fontSize: 13, fontWeight: 'bold' },
    cropTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    cardHeader: { padding: 10, borderBottomWidth: 1 },
    cardTitle: { fontSize: 14, fontWeight: 'bold' },
    table: { paddingHorizontal: 10 },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1 },
    tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, alignItems: 'center' },
    cell: { fontSize: 13 },
    displayContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceText: { fontSize: 13 },
    editButton: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6 },
    editText: { color: '#2563eb', fontSize: 11, fontWeight: 'bold' },
    deleteButton: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6 },
    deleteText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
    editContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    input: { borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 6, width: 65, fontSize: 13, textAlign: 'right' },
    iconButton: { padding: 3 },
    checkIcon: { fontSize: 13 },
    xIcon: { fontSize: 13 }
});
