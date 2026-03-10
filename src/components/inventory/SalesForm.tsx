import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';

// 전화번호 자동 포맷 (010-XXXX-XXXX)
function formatPhone(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export default function SalesForm({ inventoryHook, onSuccess }: { inventoryHook: any, onSuccess: () => void }) {
    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [quantity, setQuantity] = useState(0);
    const [packagingStatus, setPackagingStatus] = useState<'도소매포장' | '택배포장' | '미포장' | '선택안함'>('선택안함');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('010-');
    const [customerAddress, setCustomerAddress] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isIsland, setIsIsland] = useState(false);

    const { theme, isDarkMode } = useTheme();

    const prices = inventoryHook.prices || [];
    const customers = inventoryHook.customers || [];
    const deliveryFee = inventoryHook.deliveryFee || 0;
    const deliveryFeeIsland = inventoryHook.deliveryFeeIsland || 0;

    // 1단계: 품목(cropType) 추출 및 상태 관리
    const cropTypes = Array.from(new Set(prices.map((p: any) => p.cropType || '사과'))) as string[];
    const [cropType, setCropType] = useState(cropTypes.length > 0 ? cropTypes[0] : '사과');

    // 2단계: 선택된 품목(cropType)에 해당하는 카테고리(중량) 추출
    const dbCategoriesForCrop = Array.from(new Set(
        prices.filter((p: any) => (p.cropType || '사과') === cropType).map((p: any) => p.category)
    )) as string[];
    const categories = dbCategoriesForCrop;
    const [category, setCategory] = useState(categories.length > 0 ? categories[0] : '10kg');

    // 3단계: 품목+카테고리에 해당하는 아이템 추출
    const itemsInCategory = prices
        .filter((p: any) => (p.cropType || '사과') === cropType && p.category === category)
        .map((p: any) => p.itemName);
    const [itemName, setItemName] = useState(itemsInCategory.length > 0 ? itemsInCategory[0] : '기본');

    // unitPrice는 품목, 카테고리, 아이템이 일치하는 기본 단가 + 포장상태가 택배포장이면 택배비 추가
    const unitPriceRecord = prices.find((p: any) => (p.cropType || '사과') === cropType && p.category === category && p.itemName === itemName);
    const basePrice = unitPriceRecord ? unitPriceRecord.price : 0;
    const appliedDeliveryFee = isIsland ? deliveryFeeIsland : deliveryFee;
    const finalUnitPrice = packagingStatus === '택배포장' ? basePrice + appliedDeliveryFee : basePrice;
    const unitPrice = finalUnitPrice;

    const dateStr = dateObj.toISOString().split('T')[0];
    const totalPrice = quantity * finalUnitPrice;

    // 품목이 바뀌면 연쇄 초기화
    const handleCropTypeSelect = (newCrop: string) => {
        setCropType(newCrop);
        const newCatGroup = Array.from(new Set(prices.filter((p: any) => (p.cropType || '사과') === newCrop).map((p: any) => p.category))) as string[];

        const firstCat = newCatGroup.length > 0 ? newCatGroup[0] : '';
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
            // 택배포장일 때만 고객정보 upsert 실행
            if (packagingStatus === '택배포장' && customerName.trim() !== '') {
                await inventoryHook.upsertCustomer({
                    name: customerName.trim(),
                    phone: customerPhone.trim(),
                    address: customerAddress.trim()
                });
            }

            await inventoryHook.addSales({
                date: dateStr,
                cropType,
                packagingStatus: packagingStatus === '선택안함' ? undefined : packagingStatus,
                category,
                itemName: itemName === '' ? undefined : itemName,
                quantity,
                unitPrice,
                totalPrice
            });
            Alert.alert('등록 완료', '판매 내역이 저장되었습니다.');
            setCustomerName(''); setCustomerPhone('010-'); setCustomerAddress(''); setIsIsland(false);
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

                    {/* 5. 주문자 정보 입력 (택배포장 시) */}
                    {packagingStatus === '택배포장' && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>🚚 5. 택배 수령인 정보 (자동저장 제공)</Text>
                            <View style={{ position: 'relative', zIndex: 10 }}>
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                    placeholder="이름 (입력 시 기존 고객 검색)"
                                    placeholderTextColor={theme.colors.subText}
                                    value={customerName}
                                    onChangeText={(t) => {
                                        setCustomerName(t);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                />
                                {showDropdown && customerName.length > 0 && (
                                    <ScrollView style={[styles.dropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} keyboardShouldPersistTaps="handled">
                                        {customers.filter((c: any) => c.name.includes(customerName)).map((c: any) => (
                                            <TouchableOpacity
                                                key={c.id}
                                                style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                                                onPress={() => {
                                                    setCustomerName(c.name);
                                                    setCustomerPhone(c.phone || '');
                                                    setCustomerAddress(c.address || '');
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{c.name}</Text>
                                                <Text style={{ color: theme.colors.subText, fontSize: 12 }}>{c.phone} | {c.address}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        {customers.filter((c: any) => c.name.includes(customerName)).length === 0 && (
                                            <TouchableOpacity onPress={() => setShowDropdown(false)} style={styles.dropdownItem}>
                                                <Text style={{ color: theme.colors.subText }}>검색 결과 없음 (새 고객으로 자동 등록됨)</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => setShowDropdown(false)} style={[styles.dropdownItem, { borderBottomWidth: 0, backgroundColor: theme.colors.background }]}>
                                            <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: 'bold' }}>닫기</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                )}
                            </View>
                            <TextInput
                                style={[styles.input, { marginTop: 8, color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                placeholder="전화번호 (예: 010-1234-5678)"
                                placeholderTextColor={theme.colors.subText}
                                value={customerPhone}
                                onChangeText={(t) => setCustomerPhone(formatPhone(t))}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={[styles.input, { marginTop: 8, color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background, minHeight: 60 }]}
                                placeholder="주소"
                                placeholderTextColor={theme.colors.subText}
                                value={customerAddress}
                                onChangeText={setCustomerAddress}
                                multiline
                            />
                            {/* 도서/산간지역 체크 */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 6 }}
                                onPress={() => setIsIsland(!isIsland)}
                            >
                                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: isIsland ? theme.colors.secondary : theme.colors.border, backgroundColor: isIsland ? theme.colors.secondary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                    {isIsland && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                                </View>
                                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: 'bold' }}>🏝️ 도서/산간지역</Text>
                                {isIsland && <Text style={{ color: theme.colors.secondary, fontSize: 12, fontWeight: 'bold' }}>(택배비 {deliveryFeeIsland.toLocaleString()}원 적용)</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 수량 입력 (Stepper) */}
                <Text style={[styles.label, { color: theme.colors.text }]}>📦 판매 수량</Text>
                <View style={styles.stepperRow}>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(-10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(-5)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>-5</Text>
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
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(5)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: isDarkMode ? theme.colors.background : '#e5e7eb' }]} onPress={() => adjustQuantity(10)}>
                        <Text style={[styles.stepperBtnText, { color: theme.colors.text }]}>+10</Text>
                    </TouchableOpacity>
                </View>

                {/* 예상 매출 */}
                <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0' }]}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.primary }]}>💰 예상 매출 {packagingStatus === '택배포장' && `(${isIsland ? '도서산간' : '일반'} 택배비 ${appliedDeliveryFee.toLocaleString()}원 포함)`}</Text>
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
    card: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 20 },
    pickerBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 10 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
    dropdown: { position: 'absolute', top: 52, left: 0, right: 0, borderWidth: 1, borderRadius: 8, maxHeight: 200, zIndex: 50, elevation: 5 },
    dropdownItem: { padding: 12, borderBottomWidth: 1 },
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
    summaryBox: {
        borderRadius: 10, padding: 14, marginTop: 20, borderWidth: 1,
    },
    summaryLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: 'bold' },
    button: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
