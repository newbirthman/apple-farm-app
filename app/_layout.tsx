import { Tabs } from 'expo-router';
import { Text, Platform, TouchableOpacity } from 'react-native';
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
                    backgroundColor: theme.colors.card,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    height: Platform.OS === 'android' ? 95 : 85,
                    paddingBottom: Platform.OS === 'android' ? 40 : 28,
                    paddingTop: 8,
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
                    title: '홈',
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
                name="schedule"
                options={{
                    title: '연간흐름',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>📅</Text>,
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: '할일',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>✅</Text>,
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
