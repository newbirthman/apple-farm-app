import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: string;
}

export default function TasksScreen() {
    const [todos, setTodos] = useState<TodoItem[]>([
        { id: '1', text: '비료 주문하기 (유기질 비료 1t)', done: false, createdAt: '2026-03-01' },
        { id: '2', text: '방상팬 가동 테스트', done: false, createdAt: '2026-03-02' },
        { id: '3', text: '전정 도구 소독 및 정비', done: true, createdAt: '2026-02-28' },
        { id: '4', text: '서리 예보 확인 (기상청)', done: false, createdAt: '2026-03-04' },
    ]);
    const [newTodo, setNewTodo] = useState('');

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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* 입력 영역 */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>📝 새 할일 추가</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        value={newTodo}
                        onChangeText={setNewTodo}
                        placeholder="할 일을 입력하세요..."
                        returnKeyType="done"
                        onSubmitEditing={addTodo}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addTodo}>
                        <Text style={styles.addButtonText}>추가</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 진행 중 */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>🔥 진행 중 ({pending.length})</Text>
                {pending.length > 0 ? (
                    pending.map(item => (
                        <TouchableOpacity key={item.id} style={styles.todoItem} onPress={() => toggleTodo(item.id)} onLongPress={() => deleteTodo(item.id)}>
                            <View style={styles.checkbox} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.todoText}>{item.text}</Text>
                                <Text style={styles.todoDate}>{item.createdAt}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>모든 할일을 완료했습니다! 🎉</Text>
                )}
            </View>

            {/* 완료 */}
            {completed.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>✅ 완료 ({completed.length})</Text>
                    {completed.map(item => (
                        <TouchableOpacity key={item.id} style={styles.todoItem} onPress={() => toggleTodo(item.id)} onLongPress={() => deleteTodo(item.id)}>
                            <View style={[styles.checkbox, styles.checkboxDone]}>
                                <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.todoText, styles.todoTextDone]}>{item.text}</Text>
                                <Text style={styles.todoDate}>{item.createdAt}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.hint}>💡 탭하면 완료/미완료 전환, 길게 누르면 삭제</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { padding: 16, paddingBottom: 32 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
    inputRow: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, color: '#1f2937' },
    addButton: { backgroundColor: '#4a5f41', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    todoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
    checkboxDone: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    todoText: { fontSize: 15, color: '#1f2937' },
    todoTextDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
    todoDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
    emptyText: { textAlign: 'center', color: '#9ca3af', padding: 16, fontSize: 14 },
    hint: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 8 },
});
