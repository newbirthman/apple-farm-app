import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function CustomersScreen() {
    const { theme, isDarkMode } = useTheme();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // 탭에 포커스될 때마다 고객 목록을 새로 불러옴
    const loadCustomers = useCallback(async () => {
        setIsLoading(true);
        const { data } = await supabase.from('customers').select('*').order('name', { ascending: true });
        setCustomers(data || []);
        setIsLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCustomers();
        }, [loadCustomers])
    );

    // 검색 필터
    const filteredCustomers = searchQuery.trim().length > 0
        ? customers.filter((c: any) =>
            c.name.includes(searchQuery) ||
            (c.phone || '').includes(searchQuery) ||
            (c.address || '').includes(searchQuery)
        )
        : customers;

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "고객 삭제",
            `정말 [${name}] 고객을 삭제하시겠습니까?`,
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('customers').delete().eq('id', id);
                            if (error) throw error;
                            setCustomers(prev => prev.filter(c => c.id !== id));
                        } catch (e: any) {
                            Alert.alert("오류", e.message);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            const { data, error } = await supabase
                .from('customers')
                .upsert({ id: editingId, name: editName.trim(), phone: editPhone.trim(), address: editAddress.trim() })
                .select()
                .single();
            if (error) throw error;
            if (data) {
                setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
            }
            setEditingId(null);
        } catch (e: any) {
            Alert.alert("오류", e.message);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.subText }]}>고객 데이터를 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* 검색 바 */}
            <View style={[styles.searchCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="이름, 전화번호, 주소로 검색..."
                    placeholderTextColor={theme.colors.subText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={{ fontSize: 16, color: theme.colors.subText }}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 고객 수 표시 */}
            <View style={styles.countRow}>
                <Text style={[styles.countText, { color: theme.colors.subText }]}>
                    👥 전체 {customers.length}명 {searchQuery.length > 0 ? `· 검색 결과 ${filteredCustomers.length}명` : ''}
                </Text>
            </View>

            {/* 고객 목록 */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                {filteredCustomers.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={{ color: theme.colors.subText, textAlign: 'center', fontSize: 14 }}>
                            {searchQuery.length > 0 ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.\n판매관리에서 택배포장 선택 시 자동으로 등록됩니다.'}
                        </Text>
                    </View>
                ) : (
                    filteredCustomers.map((c: any) => {
                        const isEditing = editingId === c.id;

                        return (
                            <View key={c.id} style={[styles.customerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                {isEditing ? (
                                    // 편집 모드
                                    <View>
                                        <TextInput
                                            style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                            value={editName}
                                            onChangeText={setEditName}
                                            placeholder="이름"
                                            placeholderTextColor={theme.colors.subText}
                                        />
                                        <TextInput
                                            style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background, marginTop: 8 }]}
                                            value={editPhone}
                                            onChangeText={setEditPhone}
                                            placeholder="전화번호"
                                            placeholderTextColor={theme.colors.subText}
                                            keyboardType="phone-pad"
                                        />
                                        <TextInput
                                            style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background, marginTop: 8, minHeight: 50 }]}
                                            value={editAddress}
                                            onChangeText={setEditAddress}
                                            placeholder="주소"
                                            placeholderTextColor={theme.colors.subText}
                                            multiline
                                        />
                                        <View style={styles.editBtnRow}>
                                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveEdit}>
                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>저장</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#555' : '#e5e7eb' }]} onPress={() => setEditingId(null)}>
                                                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>취소</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    // 표시 모드
                                    <View>
                                        <View style={styles.nameRow}>
                                            <Text style={[styles.customerName, { color: theme.colors.text }]}>👤 {c.name}</Text>
                                            <View style={styles.actionBtns}>
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}
                                                    onPress={() => {
                                                        setEditingId(c.id);
                                                        setEditName(c.name);
                                                        setEditPhone(c.phone || '');
                                                        setEditAddress(c.address || '');
                                                    }}
                                                >
                                                    <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: 'bold' }}>수정</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}
                                                    onPress={() => handleDelete(c.id, c.name)}
                                                >
                                                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>삭제</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {c.phone ? (
                                            <Text style={[styles.customerDetail, { color: theme.colors.subText }]}>📞 {c.phone}</Text>
                                        ) : null}
                                        {c.address ? (
                                            <Text style={[styles.customerDetail, { color: theme.colors.subText }]}>📍 {c.address}</Text>
                                        ) : null}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    searchCard: {
        flexDirection: 'row', alignItems: 'center',
        margin: 16, marginBottom: 0,
        padding: 12, borderRadius: 12, borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
    countRow: { paddingHorizontal: 20, paddingVertical: 10 },
    countText: { fontSize: 13 },
    emptyCard: { borderRadius: 12, padding: 32, borderWidth: 1, marginTop: 12 },
    customerCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 10 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    customerName: { fontSize: 16, fontWeight: 'bold' },
    customerDetail: { fontSize: 13, marginTop: 6 },
    actionBtns: { flexDirection: 'row', gap: 6 },
    actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    editInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
    editBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    saveBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
    cancelBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
});
