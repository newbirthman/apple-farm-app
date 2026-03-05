import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#4a5f41',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    height: Platform.OS === 'android' ? 95 : 85,
                    paddingBottom: Platform.OS === 'android' ? 40 : 28,
                    paddingTop: 8,
                },
                headerStyle: {
                    backgroundColor: '#ffffff',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f3f4f6',
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#1f2937',
                },
            }}>
            <Tabs.Screen
                name="index"
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
                    title: '지금 할일',
                    tabBarIcon: () => <Text style={{ fontSize: 22 }}>✅</Text>,
                }}
            />
        </Tabs>
    );
}
