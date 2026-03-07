import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useInventory } from '@/hooks/useInventory';
import DailyDashboard from '@/components/inventory/DailyDashboard';
import IncomingForm from '@/components/inventory/IncomingForm';
import SalesForm from '@/components/inventory/SalesForm';
import PriceListView from '@/components/inventory/PriceListView';
import { useTheme } from '@/contexts/ThemeContext';

export default function InventoryScreen() {
    const inventoryHook = useInventory();
    const [activeTab, setActiveTab] = useState('dashboard');
    const { theme } = useTheme();

    if (inventoryHook.isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.subText }]}>데이터베이스에서 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* 탭 헤더 */}
            <View style={[styles.tabHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'dashboard' && { borderBottomColor: theme.colors.primary }]} onPress={() => setActiveTab('dashboard')}>
                    <Text style={[styles.tabText, { color: activeTab === 'dashboard' ? theme.colors.primary : theme.colors.subText }]}>대시보드</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'incoming' && { borderBottomColor: theme.colors.primary }]} onPress={() => setActiveTab('incoming')}>
                    <Text style={[styles.tabText, { color: activeTab === 'incoming' ? theme.colors.primary : theme.colors.subText }]}>입고 등록</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'sales' && { borderBottomColor: theme.colors.primary }]} onPress={() => setActiveTab('sales')}>
                    <Text style={[styles.tabText, { color: activeTab === 'sales' ? theme.colors.primary : theme.colors.subText }]}>판매 등록</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'prices' && { borderBottomColor: theme.colors.primary }]} onPress={() => setActiveTab('prices')}>
                    <Text style={[styles.tabText, { color: activeTab === 'prices' ? theme.colors.primary : theme.colors.subText }]}>단가표</Text>
                </TouchableOpacity>
            </View>

            {/* 컨텐츠 영역 */}
            <View style={styles.content}>
                {activeTab === 'dashboard' && <DailyDashboard inventoryHook={inventoryHook} />}
                {activeTab === 'incoming' && <IncomingForm inventoryHook={inventoryHook} onSuccess={() => setActiveTab('dashboard')} />}
                {activeTab === 'sales' && <SalesForm inventoryHook={inventoryHook} onSuccess={() => setActiveTab('dashboard')} />}
                {activeTab === 'prices' && <PriceListView prices={inventoryHook.prices} updatePrice={inventoryHook.updatePrice} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    tabHeader: { flexDirection: 'row', borderBottomWidth: 1 },
    tabButton: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontWeight: 'bold', fontSize: 13 },
    content: { flex: 1, padding: 16 },
});
