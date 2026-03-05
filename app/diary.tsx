import { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface MemoEntry {
    id: string;
    date: string;
    content: string;
    photoUri?: string;
}

export default function IndexScreen() {
    const [memos, setMemos] = useState<MemoEntry[]>([]);
    const [content, setContent] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    // 사진 선택/촬영
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    // R2로 사진 업로드
    const uploadPhoto = async (uri: string): Promise<string | null> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `diary_${Date.now()}.jpg`;
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: filename,
                type: 'image/jpeg',
            } as any);

            const uploadRes = await fetch('https://apple-farm-138.pages.dev/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                return data.url || null;
            }
            return null;
        } catch (err) {
            console.error('사진 업로드 오류:', err);
            return null;
        }
    };

    // 일지 저장
    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert('입력 오류', '일지 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedUrl: string | undefined;

            if (photoUri) {
                const url = await uploadPhoto(photoUri);
                if (url) uploadedUrl = url;
            }

            const newMemo: MemoEntry = {
                id: Date.now().toString(),
                date: today,
                content: content.trim(),
                photoUri: uploadedUrl || photoUri || undefined,
            };

            setMemos(prev => [newMemo, ...prev]);
            setContent('');
            setPhotoUri(null);
            Alert.alert('저장 완료', '영농일지가 기록되었습니다.');
        } catch (err: any) {
            Alert.alert('오류', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 일지 작성 카드 */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>📝 오늘의 영농일지</Text>
                    <Text style={styles.dateText}>{today}</Text>

                    <TextInput
                        style={styles.textArea}
                        value={content}
                        onChangeText={setContent}
                        placeholder="오늘 한 작업, 날씨, 메모 등을 자유롭게 기록하세요..."
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />

                    {/* 사진 미리보기 */}
                    {photoUri && (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: photoUri }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.removeButton} onPress={() => setPhotoUri(null)}>
                                <Text style={styles.removeButtonText}>✕ 사진 제거</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 사진 버튼들 */}
                    <View style={styles.photoButtons}>
                        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                            <Text style={styles.photoButtonText}>🖼 갤러리</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                            <Text style={styles.photoButtonText}>📷 카메라</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 저장 버튼 */}
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>일지 저장하기</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 일지 목록 */}
                {memos.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>📋 기록된 일지</Text>
                        {memos.map(memo => (
                            <View key={memo.id} style={styles.memoItem}>
                                <Text style={styles.memoDate}>{memo.date}</Text>
                                <Text style={styles.memoContent}>{memo.content}</Text>
                                {memo.photoUri && (
                                    <Image source={{ uri: memo.photoUri }} style={styles.memoImage} />
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    scrollContent: { padding: 16, paddingBottom: 32 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    dateText: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
    textArea: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
        padding: 12, fontSize: 15, color: '#1f2937', minHeight: 120,
    },
    previewContainer: { marginTop: 12, alignItems: 'center' },
    previewImage: { width: '100%', height: 200, borderRadius: 8 },
    removeButton: { marginTop: 8 },
    removeButtonText: { color: '#ef4444', fontSize: 13, fontWeight: 'bold' },
    photoButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
    photoButton: {
        flex: 1, backgroundColor: '#f3f4f6', padding: 14, borderRadius: 8,
        alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb',
    },
    photoButtonText: { fontSize: 15, color: '#374151', fontWeight: '600' },
    submitButton: {
        backgroundColor: '#4a5f41', padding: 16, borderRadius: 8,
        alignItems: 'center', marginTop: 20,
    },
    submitButtonDisabled: { backgroundColor: '#a3b899' },
    submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    memoItem: {
        borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 12,
    },
    memoDate: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    memoContent: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
    memoImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 8 },
});
