import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useInventory } from '@/hooks/useInventory';
import DailyDashboard from '@/components/inventory/DailyDashboard';
import IncomingForm from '@/components/inventory/IncomingForm';
import SalesForm from '@/components/inventory/SalesForm';
import PriceListView from '@/components/inventory/PriceListView';

export default function InventoryScreen() {
    const inventoryHook = useInventory();
    const [activeTab, setActiveTab] = useState('dashboard');

    if (inventoryHook.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>데이터베이스에서 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 탭 헤더 */}
            <View style={styles.tabHeader}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'dashboard' && styles.tabActive]} onPress={() => setActiveTab('dashboard')}>
                    <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>대시보드</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'incoming' && styles.tabActive]} onPress={() => setActiveTab('incoming')}>
                    <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>입고 등록</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'sales' && styles.tabActive]} onPress={() => setActiveTab('sales')}>
                    <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>판매 등록</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'prices' && styles.tabActive]} onPress={() => setActiveTab('prices')}>
                    <Text style={[styles.tabText, activeTab === 'prices' && styles.tabTextActive]}>단가표</Text>
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
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
    loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
    tabHeader: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tabButton: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#16a34a' },
    tabText: { color: '#6b7280', fontWeight: 'bold', fontSize: 14 },
    tabTextActive: { color: '#16a34a' },
    content: { flex: 1, padding: 16 },
});
