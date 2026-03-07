import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: string;
}

export default function TasksScreen() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const { theme, isDarkMode } = useTheme();

    const addTodo = () => {
        if (!newTodo.trim()) {
            Alert.alert('입력 오류', '할일 내용을 입력해주세요.');
            return;
        }
        const item: TodoItem = {
            id: Date.now().toString(),
            text: newTodo.trim(),
            done: false,
            createdAt: new Date().toISOString().split('T')[0],
        };
        setTodos(prev => [item, ...prev]);
        setNewTodo('');
    };

    const toggleTodo = (id: string) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTodo = (id: string) => {
        Alert.alert('삭제 확인', '이 할일을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => setTodos(prev => prev.filter(t => t.id !== id)) },
        ]);
    };

    const pending = todos.filter(t => !t.done);
    const completed = todos.filter(t => t.done);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            {/* 입력 영역 */}
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📝 새 할일 추가</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDarkMode ? theme.colors.background : '#fff', color: theme.colors.text, borderColor: theme.colors.border }]}
                        value={newTodo}
                        onChangeText={setNewTodo}
                        placeholder="할 일을 입력하세요..."
                        placeholderTextColor={theme.colors.subText}
                        returnKeyType="done"
                        onSubmitEditing={addTodo}
                    />
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addTodo}>
                        <Text style={styles.addButtonText}>추가</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 진행 중 */}
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🔥 진행 중 ({pending.length})</Text>
                {pending.length > 0 ? (
                    pending.map(item => (
                        <TouchableOpacity key={item.id} style={[styles.todoItem, { borderBottomColor: theme.colors.border }]} onPress={() => toggleTodo(item.id)} onLongPress={() => deleteTodo(item.id)}>
                            <View style={[styles.checkbox, { borderColor: theme.colors.border }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.todoText, { color: theme.colors.text }]}>{item.text}</Text>
                                <Text style={[styles.todoDate, { color: theme.colors.subText }]}>{item.createdAt}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.subText }]}>모든 할일을 완료했습니다! 🎉</Text>
                )}
            </View>

            {/* 완료 */}
            {completed.length > 0 && (
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>✅ 완료 ({completed.length})</Text>
                    {completed.map(item => (
                        <TouchableOpacity key={item.id} style={[styles.todoItem, { borderBottomColor: theme.colors.border }]} onPress={() => toggleTodo(item.id)} onLongPress={() => deleteTodo(item.id)}>
                            <View style={[styles.checkbox, styles.checkboxDone, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                                <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.todoText, styles.todoTextDone, { color: theme.colors.subText }]}>{item.text}</Text>
                                <Text style={[styles.todoDate, { color: theme.colors.subText }]}>{item.createdAt}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={[styles.hint, { color: theme.colors.subText }]}>💡 탭하면 완료/미완료 전환, 길게 누르면 삭제</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    card: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
    inputRow: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
    addButton: { paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    todoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    checkboxDone: {},
    todoText: { fontSize: 15 },
    todoTextDone: { textDecorationLine: 'line-through' },
    todoDate: { fontSize: 11, marginTop: 2 },
    emptyText: { textAlign: 'center', padding: 16, fontSize: 14 },
    hint: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
