import { View, Text, StyleSheet } from 'react-native';

export default function TasksScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.title}>지금 할일</Text>
            <Text style={styles.subtitle}>화면 준비 중...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    emoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
});
