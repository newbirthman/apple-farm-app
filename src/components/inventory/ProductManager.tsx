import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const WEIGHT_UNITS = ['Kg', 'g', '박스', '상자', '망', '단', '개'];
const ITEM_UNITS = ['과', '개', '크기', '박스', '상자', '망', '단', '봉지', '특대', '대', '중', '소', '미포장상자', '기본'];

export default function ProductManager({ inventoryHook, onSuccess }: { inventoryHook: any, onSuccess: () => void }) {
    const { theme, isDarkMode } = useTheme();

    // 상태 정의
    const [cropType, setCropType] = useState('');
    const [weightValue, setWeightValue] = useState(10);
    const [weightUnit, setWeightUnit] = useState('Kg');
    const [itemValue, setItemValue] = useState(20);
    const [itemUnit, setItemUnit] = useState('과');
    const [price, setPrice] = useState('0');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 값을 조정하는 함수
    const adjustWeight = (delta: number) => setWeightValue(prev => Math.max(0, prev + delta));
    const adjustItem = (delta: number) => setItemValue(prev => Math.max(0, prev + delta));

    const handleSubmit = async () => {
        if (!cropType.trim()) {
            Alert.alert('입력 오류', '품목(농산물 종류)은 필수 입력 사항입니다.');
            return;
        }

        // 숫자 값이 0이면 단위만 사용 (예: "0미포장상자" -> "미포장상자")
        const finalCategory = (weightValue > 0 ? `${weightValue}${weightUnit}` : weightUnit).trim();
        const finalItemName = (itemValue > 0 ? `${itemValue}${itemUnit}` : itemUnit).trim() || '기본';
        const finalPrice = parseInt(price.replace(/,/g, ''), 10) || 0;

        if (!finalCategory) {
            Alert.alert('입력 오류', '중량(분류)을 올바르게 설정해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await inventoryHook.addPriceItem({
                cropType: cropType.trim(),
                category: finalCategory,
                itemName: finalItemName,
                price: finalPrice
            });
            Alert.alert('등록 완료', '새로운 상품이 단가표에 등록되었습니다.');

            // 폼 초기화 (사용자 요청: cropType은 그대로 유지)
            setWeightValue(10);
            setWeightUnit('Kg');
            setItemValue(20);
            setItemUnit('과');
            setPrice('0');

            if (onSuccess) onSuccess();
        } catch (err: any) {
            Alert.alert('오류 발생', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.headerText, { color: theme.colors.text }]}>🌱 새로운 농산물 단위 등록</Text>
                <Text style={[styles.subHeaderText, { color: theme.colors.subText }]}>
                    자주 사용하는 단위를 조합하여 규격을 생성합니다. 숫자를 0으로 설정하면 숫자 없이 "단위명"만 텍스트로 등록됩니다. (예: 숫자 0 + "미포장상자" = "미포장상자")
                </Text>

                {/* 1. 품목 */}
                <Text style={[styles.label, { color: theme.colors.text }]}>1. 품목 (연속 등록 시 값 유지)</Text>
                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="예: 사과, 배, 복숭아, 배추..."
                    placeholderTextColor={theme.colors.subText}
                    value={cropType}
                    onChangeText={setCropType}
                />

                <View style={styles.separator} />

                {/* 2. 중량 (Category) */}
                <Text style={[styles.label, { color: theme.colors.text }]}>2. 분류/중량: <Text style={{ color: theme.colors.primary }}>{weightValue > 0 ? `${weightValue}${weightUnit}` : weightUnit}</Text></Text>

                {/* Stepper */}
                <View style={styles.stepperRow}>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustWeight(-10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustWeight(-1)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-1</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.stepperInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        value={String(weightValue)}
                        onChangeText={(t) => {
                            const n = parseInt(t, 10);
                            if (!isNaN(n) && n >= 0) setWeightValue(n);
                            else if (t === '') setWeightValue(0);
                        }}
                        keyboardType="numeric"
                        textAlign="center"
                    />
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustWeight(1)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustWeight(10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+10</Text>
                    </TouchableOpacity>
                </View>

                {/* Units */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {WEIGHT_UNITS.map((unit) => {
                        const isSelected = weightUnit === unit;
                        return (
                            <TouchableOpacity
                                key={unit}
                                onPress={() => setWeightUnit(unit)}
                                style={[styles.chip, {
                                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                    borderColor: isSelected ? theme.colors.primary : theme.colors.border
                                }]}
                            >
                                <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.colors.text }]}>{unit}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>


                <View style={styles.separator} />

                {/* 3. 품목명 (ItemName) */}
                <Text style={[styles.label, { color: theme.colors.text }]}>3. 수량(개수): <Text style={{ color: theme.colors.secondary }}>{itemValue > 0 ? `${itemValue}${itemUnit}` : itemUnit}</Text></Text>

                {/* Stepper */}
                <View style={styles.stepperRow}>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustItem(-10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustItem(-1)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-1</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.stepperInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        value={String(itemValue)}
                        onChangeText={(t) => {
                            const n = parseInt(t, 10);
                            if (!isNaN(n) && n >= 0) setItemValue(n);
                            else if (t === '') setItemValue(0);
                        }}
                        keyboardType="numeric"
                        textAlign="center"
                    />
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustItem(1)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustItem(10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+10</Text>
                    </TouchableOpacity>
                </View>

                {/* Units */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {ITEM_UNITS.map((unit) => {
                        const isSelected = itemUnit === unit;
                        return (
                            <TouchableOpacity
                                key={unit}
                                onPress={() => setItemUnit(unit)}
                                style={[styles.chip, {
                                    backgroundColor: isSelected ? theme.colors.secondary : theme.colors.background,
                                    borderColor: isSelected ? theme.colors.secondary : theme.colors.border
                                }]}
                            >
                                <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.colors.text }]}>{unit}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.separator} />

                {/* 4. 단가 (Price) */}
                <Text style={[styles.label, { color: theme.colors.text }]}>4. 기준 단가</Text>
                <View style={[styles.priceInputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <TextInput
                        style={[styles.priceInput, { color: theme.colors.text }]}
                        value={price}
                        onChangeText={(t) => {
                            const num = t.replace(/[^0-9]/g, '');
                            if (num) setPrice(parseInt(num, 10).toLocaleString());
                            else setPrice('');
                        }}
                        keyboardType="numeric"
                        textAlign="right"
                        placeholder="0"
                        placeholderTextColor={theme.colors.subText}
                    />
                    <Text style={[styles.currencyText, { color: theme.colors.subText }]}>원</Text>
                </View>

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe' }]}>
                    <Text style={[styles.infoText, { color: isDarkMode ? '#60a5fa' : '#1d4ed8' }]}>
                        💡 상품 등록 시 단가를 지정할 수 있습니다. 입력된 단가는 즉시 단가표에 반영되며 언제든 수정 가능합니다.
                    </Text>
                </View>

                {/* 제출 */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }, isSubmitting && { backgroundColor: theme.colors.primaryLight }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>단가표에 상품 등록하기</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingBottom: 20 },
    card: { borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 8 },
    headerText: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
    subHeaderText: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, marginTop: 6 },
    input: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 15 },
    separator: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 24 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    stepperBtn: {
        borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    stepperBtnText: { fontSize: 15, fontWeight: 'bold' },
    stepperInput: {
        flex: 1, borderWidth: 1, borderRadius: 8,
        padding: 12, fontSize: 18, fontWeight: 'bold',
    },
    chipScroll: { gap: 8, paddingBottom: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, borderWidth: 1, marginRight: 8,
    },
    chipText: { fontSize: 14, fontWeight: '500' },
    priceInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 2 },
    priceInput: { flex: 1, fontSize: 18, fontWeight: 'bold', paddingVertical: 12 },
    currencyText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    infoBox: { marginTop: 30, padding: 12, borderRadius: 8, borderWidth: 1 },
    infoText: { fontSize: 12, lineHeight: 18 },
    button: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
