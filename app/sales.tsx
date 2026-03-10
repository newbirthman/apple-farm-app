import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useInventory } from '@/hooks/useInventory';
import SalesForm from '@/components/inventory/SalesForm';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function SalesScreen() {
    const inventoryHook = useInventory();
    const { theme } = useTheme();
    const router = useRouter();

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
            <View style={styles.content}>
                <SalesForm
                    inventoryHook={inventoryHook}
                    onSuccess={() => {
                        // 등록 완료 시나리오: 재고관리 대시보드로 이동
                        router.navigate('/inventory');
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    content: { flex: 1, padding: 16 },
});
