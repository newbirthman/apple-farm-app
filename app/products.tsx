import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useInventory } from '@/hooks/useInventory';
import PriceListView from '@/components/inventory/PriceListView';
import ProductManager from '@/components/inventory/ProductManager';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProductsScreen() {
    const inventoryHook = useInventory();
    const [activeTab, setActiveTab] = useState('product');
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
                <TouchableOpacity style={[styles.tabButton, activeTab === 'product' && { borderBottomColor: theme.colors.primary }]} onPress={() => setActiveTab('product')}>
                    <Text style={[styles.tabText, { color: activeTab === 'product' ? theme.colors.primary : theme.colors.subText }]}>상품 등록</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'prices' && { borderBottomColor: theme.colors.primary }]} onPress={() => setActiveTab('prices')}>
                    <Text style={[styles.tabText, { color: activeTab === 'prices' ? theme.colors.primary : theme.colors.subText }]}>단가표</Text>
                </TouchableOpacity>
            </View>

            {/* 컨텐츠 영역 */}
            <View style={styles.content}>
                {activeTab === 'product' && <ProductManager inventoryHook={inventoryHook} onSuccess={() => { }} />}
                {activeTab === 'prices' && <PriceListView prices={inventoryHook.prices} deliveryFee={inventoryHook.deliveryFee} deliveryFeeIsland={inventoryHook.deliveryFeeIsland} updateDeliveryFee={inventoryHook.updateDeliveryFee} updateDeliveryFeeIsland={inventoryHook.updateDeliveryFeeIsland} updatePrice={inventoryHook.updatePrice} deletePriceItem={inventoryHook.deletePriceItem} />}
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
    tabText: { fontWeight: 'bold', fontSize: 14 },
    content: { flex: 1, padding: 16 },
});
