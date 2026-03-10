import { Tabs } from 'expo-router';
import { Text, View, Platform, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function TabNavigator() {
    const { theme, isDarkMode, toggleTheme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                sceneContainerStyle: {
                    backgroundColor: theme.colors.background,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.subText,
                tabBarStyle: {
                    elevation: 12,
                    backgroundColor: theme.colors.card,
                    borderTopWidth: 0,
                    height: Platform.OS === 'android' ? 120 : 115, // 탭바 전체 높이를 크게 키움 (컨텐츠는 이 높이만큼 자동으로 밀려남)
                    paddingBottom: Platform.OS === 'android' ? 55 : 50, // 아이콘 메뉴들만 위쪽으로 강제로 끌어올림
                    paddingTop: 15,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                },
                headerStyle: {
                    backgroundColor: theme.colors.card,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: theme.colors.text,
                },
                headerRight: () => (
                    <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 16 }}>
                        <Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
                    </TouchableOpacity>
                ),
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: '스마트 영농일지',
                    tabBarLabel: '홈',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
                }}
            />
            <Tabs.Screen
                name="diary"
                options={{
                    title: '영농일지',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>📖</Text>,
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: '재고관리',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>📦</Text>,
                }}
            />
            <Tabs.Screen
                name="sales"
                options={{
                    title: '판매관리',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>💵</Text>,
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: '상품관리',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏷️</Text>,
                }}
            />
            <Tabs.Screen
                name="customers"
                options={{
                    title: '고객관리',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>👥</Text>,
                }}
            />
        </Tabs>
    );
}

export default function TabLayout() {
    return (
        <ThemeProvider>
            <TabNavigator />
        </ThemeProvider>
    );
}
