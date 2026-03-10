import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';

export default function IncomingForm({ inventoryHook, onSuccess }: { inventoryHook: any, onSuccess: () => void }) {
    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [type, setType] = useState('판매대기');
    const [quantity, setQuantity] = useState(0);
    const [packagingStatus, setPackagingStatus] = useState<'도소매포장' | '택배포장' | '미포장' | '선택안함'>('선택안함');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { theme, isDarkMode } = useTheme();

    console.log('디버깅: IncomingForm 최신 코드 렌더링 됨. quantity:', quantity);

    const prices = inventoryHook.prices || [];

    // 1단계: 품목(cropType) 추출 및 상태 관리
    const cropTypes = Array.from(new Set(prices.map((p: any) => p.cropType || '사과'))) as string[];
    const [cropType, setCropType] = useState(cropTypes.length > 0 ? cropTypes[0] : '사과');

    // 2단계: 선택된 품목(cropType)에 해당하는 카테고리(중량) 추출 (미포장상자 포함)
    const dbCategoriesForCrop = Array.from(new Set(
        prices.filter((p: any) => (p.cropType || '사과') === cropType).map((p: any) => p.category)
    )) as string[];
    const categories = Array.from(new Set([...dbCategoriesForCrop, '미포장상자']));
    const [category, setCategory] = useState(categories.length > 0 ? categories[0] : '10kg');

    // 3단계: 품목+카테고리에 해당하는 아이템 추출
    const itemsInCategory = prices
        .filter((p: any) => (p.cropType || '사과') === cropType && p.category === category)
        .map((p: any) => p.itemName);
    const [itemName, setItemName] = useState(itemsInCategory.length > 0 ? itemsInCategory[0] : '');

    const dateStr = dateObj.toISOString().split('T')[0];

    // 품목이 바뀌면 연쇄 초기화
    const handleCropTypeSelect = (newCrop: string) => {
        setCropType(newCrop);
        const newCatGroup = Array.from(new Set(prices.filter((p: any) => (p.cropType || '사과') === newCrop).map((p: any) => p.category))) as string[];
        const newCats = Array.from(new Set([...newCatGroup, '미포장상자']));

        const firstCat = newCats.length > 0 ? newCats[0] : '';
        setCategory(firstCat);

        const newItems = prices.filter((p: any) => (p.cropType || '사과') === newCrop && p.category === firstCat).map((p: any) => p.itemName);
        setItemName(newItems.length > 0 ? newItems[0] : '');
    };

    // 카테고리가 바뀌면 기본 품목명도 함께 변경
    const handleCategorySelect = (newCategory: string) => {
        setCategory(newCategory);
        const newItems = prices.filter((p: any) => (p.cropType || '사과') === cropType && p.category === newCategory).map((p: any) => p.itemName);
        if (newItems.length > 0) {
            setItemName(newItems[0]);
        } else {
            setItemName('');
        }
    };

    const onDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDateObj(selectedDate);
    };

    const adjustQuantity = (delta: number) => {
        setQuantity(prev => Math.max(0, prev + delta));
    };

    const handleSubmit = async () => {
        if (quantity <= 0) {
            Alert.alert('입력 오류', '수량은 1 이상이어야 합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            await inventoryHook.addIncoming({
                date: dateStr,
                type,
                boxType: undefined, // 기존 사용 안 함
                cropType,
                category,
                itemName: itemName === '' ? undefined : itemName,
                packagingStatus: packagingStatus === '선택안함' ? undefined : packagingStatus,
                quantity
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

                {/* 상품 3단계 트리 선택 */}
                <View style={[styles.pickerBox, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc', borderColor: theme.colors.border }]}>

                    {/* 1. 품목(cropType) 선택 */}
                    <Text style={[styles.label, { color: theme.colors.text, marginTop: 4 }]}>🌱 1. 품목 (농산물)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {cropTypes.map((crop: any) => {
                            const isSelected = cropType === crop;
                            return (
                                <TouchableOpacity
                                    key={crop}
                                    onPress={() => handleCropTypeSelect(crop)}
                                    style={[styles.chip, {
                                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border
                                    }]}
                                >
                                    <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.colors.text }]}>{crop}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* 2. 카테고리(중량) 선택 */}
                    <Text style={[styles.label, { color: theme.colors.text }]}>📦 2. 중량/형태</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {categories.map((cat: any) => {
                            const isSelected = category === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => handleCategorySelect(cat)}
                                    style={[styles.chip, {
                                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border
                                    }]}
                                >
                                    <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.colors.text }]}>{cat}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* 3. 품목명(과수) 선택 */}
                    <Text style={[styles.label, { color: theme.colors.text }]}>🍎 3. 개수/크기</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {itemsInCategory.length > 0 ? itemsInCategory.map((item: any) => {
                            const isSelected = itemName === item;
                            return (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => setItemName(item)}
                                    style={[styles.chip, {
                                        backgroundColor: isSelected ? theme.colors.secondary : theme.colors.background,
                                        borderColor: isSelected ? theme.colors.secondary : theme.colors.border
                                    }]}
                                >
                                    <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.colors.text }]}>{item || '기본'}</Text>
                                </TouchableOpacity>
                            );
                        }) : (
                            <Text style={{ color: theme.colors.subText, fontStyle: 'italic', paddingVertical: 8 }}>해당 분류에 등록된 세부 품목이 없습니다.</Text>
                        )}
                    </ScrollView>

                    {/* 4. 포장 상태 선택 (신규) */}
                    <Text style={[styles.label, { color: theme.colors.text, marginTop: 8 }]}>📦 4. 포장상태</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {['선택안함', '도소매포장', '택배포장', '미포장'].map((status: any) => {
                            const isSelected = packagingStatus === status;
                            return (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setPackagingStatus(status)}
                                    style={[styles.chip, {
                                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border
                                    }]}
                                >
                                    <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.colors.text }]}>{status}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* 수량 입력 (Stepper) */}
                <Text style={[styles.label, { color: theme.colors.text }]}>🔢 수량 (박스/상자)</Text>
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

                {/* 제출 */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }, isSubmitting && { backgroundColor: theme.colors.primaryLight }]}
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
    card: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 20 },
    pickerBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 10 },
    dateButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderRadius: 8, padding: 14,
    },
    dateButtonText: { fontSize: 16, fontWeight: '500' },
    dateButtonIcon: { fontSize: 20 },
    chipScroll: { gap: 8, paddingBottom: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, borderWidth: 1, marginRight: 8,
    },
    chipText: { fontSize: 14, fontWeight: 'bold' },
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
    button: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
