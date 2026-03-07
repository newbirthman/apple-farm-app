import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';

export default function SalesForm({ inventoryHook, onSuccess }: { inventoryHook: any, onSuccess: () => void }) {
    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { theme, isDarkMode } = useTheme();

    const category = '10kg';
    const itemName = '20과';
    const unitPrice = inventoryHook.getPrice(category, itemName) || 100000;
    const dateStr = dateObj.toISOString().split('T')[0];
    const totalPrice = quantity * unitPrice;

    const onDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDateObj(selectedDate);
    };

    const adjustQuantity = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleSubmit = async () => {
        if (quantity <= 0) {
            Alert.alert('입력 오류', '수량은 1 이상이어야 합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            await inventoryHook.addSales({
                date: dateStr,
                category,
                itemName,
                quantity,
                unitPrice,
                totalPrice
            });
            Alert.alert('등록 완료', '판매 내역이 저장되었습니다.');
            onSuccess();
        } catch (err: any) {
            Alert.alert('오류 발생', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                {/* 날짜 선택 */}
                <Text style={[styles.label, { color: theme.colors.text }]}>📅 날짜</Text>
                <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} onPress={() => setShowDatePicker(true)}>
                    <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>{dateStr}</Text>
                    <Text style={styles.dateButtonIcon}>📆</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={dateObj}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                        onChange={onDateChange}
                    />
                )}

                {/* 수량 입력 (Stepper) */}
                <Text style={[styles.label, { color: theme.colors.text }]}>📦 판매 수량</Text>
                <View style={styles.stepperRow}>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(-10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(-1)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-1</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.stepperInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                        value={String(quantity)}
                        onChangeText={(t) => {
                            const n = parseInt(t, 10);
                            if (!isNaN(n) && n >= 0) setQuantity(n);
                            else if (t === '') setQuantity(0);
                        }}
                        keyboardType="numeric"
                        textAlign="center"
                    />
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(1)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+10</Text>
                    </TouchableOpacity>
                </View>

                {/* 예상 매출 */}
                <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0' }]}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.primary }]}>💰 예상 매출</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                        {quantity} × {unitPrice.toLocaleString()}원 = {totalPrice.toLocaleString()}원
                    </Text>
                </View>

                {/* 제출 */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#2563eb' }, isSubmitting && { backgroundColor: '#93c5fd' }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>판매 등록하기</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { borderRadius: 12, padding: 16, borderWidth: 1 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
    dateButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderRadius: 8, padding: 14,
    },
    dateButtonText: { fontSize: 16, fontWeight: '500' },
    dateButtonIcon: { fontSize: 20 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepperBtn: {
        borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    stepperBtnText: { fontSize: 15, fontWeight: 'bold' },
    stepperInput: {
        flex: 1, borderWidth: 1, borderRadius: 8,
        padding: 12, fontSize: 18, fontWeight: 'bold',
    },
    summaryBox: {
        borderRadius: 10, padding: 14, marginTop: 20, borderWidth: 1,
    },
    summaryLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: 'bold' },
    button: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
