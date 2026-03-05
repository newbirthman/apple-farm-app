import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

export default function IncomingForm({ inventoryHook, onSuccess }: { inventoryHook: any, onSuccess: () => void }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('판매대기');
    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 간소화를 위해 '판매대기' 항목 고정 (웹에서는 Category 등을 선택하지만 모바일 데모를 위해 우선 단순화)
    const category = '10kg';
    const itemName = '20과';

    const handleSubmit = async () => {
        if (!quantity || isNaN(Number(quantity))) {
            Alert.alert('입력 오류', '수량을 정확히 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await inventoryHook.addIncoming({
                date,
                type,
                boxType: '선물용',
                category,
                itemName,
                quantity: Number(quantity)
            });
            Alert.alert('등록 완료', '입고 내역이 저장되었습니다.');
            onSuccess();
        } catch (err: any) {
            Alert.alert('오류 발생', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>날짜 (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} />

                <Text style={styles.label}>수량 (박스/상자)</Text>
                <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="수량을 입력하세요"
                />

                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>입고 등록하기</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderColor: '#e5e7eb', borderWidth: 1 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#1f2937' },
    button: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonDisabled: { backgroundColor: '#86efac' },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
