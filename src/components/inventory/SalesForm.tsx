import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

export default function SalesForm({ inventoryHook, onSuccess }: { inventoryHook: any, onSuccess: () => void }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const category = '10kg';
    const itemName = '20과';
    const unitPrice = inventoryHook.getPrice(category, itemName) || 100000;

    const handleSubmit = async () => {
        if (!quantity || isNaN(Number(quantity))) {
            Alert.alert('입력 오류', '수량을 정확히 입력해주세요.');
            return;
        }

        const total = Number(quantity) * unitPrice;

        setIsSubmitting(true);
        try {
            await inventoryHook.addSales({
                date,
                category,
                itemName,
                quantity: Number(quantity),
                unitPrice,
                totalPrice: total
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
            <View style={styles.card}>
                <Text style={styles.label}>날짜 (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} />

                <Text style={styles.label}>판매 수량</Text>
                <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="판매된 박스 수량"
                />

                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
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
    card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderColor: '#e5e7eb', borderWidth: 1 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#1f2937' },
    button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonDisabled: { backgroundColor: '#93c5fd' },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
