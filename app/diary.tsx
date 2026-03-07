import { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

interface MemoEntry {
    id: string;
    date: string;
    content: string;
    photoUrl?: string; // photoUri 대신 photoUrl 매칭 (웹앱 스네이크케이스 photo_url 매핑)
    created_at?: string;
}

export default function IndexScreen() {
    const [memos, setMemos] = useState<MemoEntry[]>([]);
    const [content, setContent] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 모달 및 상세보기 상태
    const [selectedMemo, setSelectedMemo] = useState<MemoEntry | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // 테마 임포트
    const { theme, isDarkMode } = useTheme();
    const today = new Date().toISOString().split('T')[0];

    // Supabase에서 데이터 가져오기 (초기 로딩 및 구독)
    const fetchMemos = async () => {
        try {
            const { data, error } = await supabase
                .from('memos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const formattedMemos = data.map((item: any) => ({
                    id: item.id,
                    date: item.date,
                    content: item.content,
                    photoUrl: item.photo_url || item.photoUri,
                }));
                setMemos(formattedMemos);
            }
        } catch (error: any) {
            console.error('영농일지 불러오기 에러:', error.message);
        }
    };

    useEffect(() => {
        fetchMemos();

        // 실시간 연동 (웹앱과 모바일 양방향 동기화)
        const subscription = supabase
            .channel('memos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'memos' }, () => {
                fetchMemos(); // 무언가 변하면 다시 가져오기
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    // 자주 쓰는 농장 작업 태그
    const QUICK_TAGS = [
        { icon: '💧', label: '물주기', text: '과수원 전체 관수 작업 완료.' },
        { icon: '💊', label: '방제/농약', text: '병해충 방제 작업 진행함.' },
        { icon: '✂️', label: '전정', text: '웃자란 가지 전정(가지치기) 완료.' },
        { icon: '🌱', label: '비료', text: '퇴비 살포 및 밭고르기 진행.' },
        { icon: '🍎', label: '수확', text: '사과 수확 및 선별 작업 중.' },
        { icon: '📦', label: '포장/출하', text: '주문 건 포장 및 택배 발송 처리.' }
    ];

    const handleQuickTag = (tagText: string) => {
        setContent(prev => {
            const trimmed = prev.trim();
            if (trimmed.length > 0) {
                return trimmed + '\n' + tagText;
            }
            return tagText;
        });
    };

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

            // Supabase Database에 기록
            const { error } = await supabase
                .from('memos')
                .insert([{
                    date: today,
                    content: content.trim(),
                    photo_url: uploadedUrl || photoUri || null
                }]);

            if (error) throw error;

            setContent('');
            setPhotoUri(null);
            Alert.alert('저장 완료', '영농일지가 기록되었습니다.');
        } catch (err: any) {
            Alert.alert('오류', '저장에 실패했습니다: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 일지 수정 저장 (Supabase 연동)
    const handleUpdate = async () => {
        if (!selectedMemo) return;
        if (!editContent.trim()) {
            Alert.alert('입력 오류', '내용을 입력해주세요.');
            return;
        }

        try {
            const { error } = await supabase
                .from('memos')
                .update({ content: editContent.trim() })
                .eq('id', selectedMemo.id);

            if (error) throw error;

            setSelectedMemo({ ...selectedMemo, content: editContent.trim() });
            setIsEditing(false);
            Alert.alert('수정 완료', '일지가 수정되었습니다.');
        } catch (err: any) {
            Alert.alert('오류', '수정에 실패했습니다: ' + err.message);
        }
    };

    // 일지 삭제 (Supabase 연동)
    const handleDelete = () => {
        if (!selectedMemo) return;
        Alert.alert('삭제 확인', '이 영농일지를 정말 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    try {
                        const { error } = await supabase
                            .from('memos')
                            .delete()
                            .eq('id', selectedMemo.id);

                        if (error) throw error;
                        setSelectedMemo(null);
                    } catch (err: any) {
                        Alert.alert('삭제 오류', err.message);
                    }
                }
            }
        ]);
    };

    // 모달 열기
    const openMemoDetail = (memo: MemoEntry) => {
        setSelectedMemo(memo);
        setEditContent(memo.content);
        setIsEditing(false);
    };

    return (
        <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 일지 작성 카드 */}
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📝 오늘의 영농일지</Text>
                    <Text style={[styles.dateText, { color: theme.colors.subText }]}>{today}</Text>

                    <TextInput
                        style={[styles.textArea, { backgroundColor: isDarkMode ? theme.colors.background : '#fff', color: theme.colors.text, borderColor: theme.colors.border }]}
                        value={content}
                        onChangeText={setContent}
                        placeholder="오늘 한 작업, 날씨, 메모 등을 자유롭게 기록하세요..."
                        placeholderTextColor={theme.colors.subText}
                        placeholderTextColor={theme.colors.subText}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />

                    {/* 빠른 입력 태그 모음 */}
                    <View style={styles.quickTagsContainer}>
                        <Text style={[styles.quickTagsLabel, { color: theme.colors.subText }]}>⚡ 빠른 입력:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTagsList}>
                            {QUICK_TAGS.map((tag, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.tagChip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                                    onPress={() => handleQuickTag(tag.text)}
                                >
                                    <Text style={styles.tagIcon}>{tag.icon}</Text>
                                    <Text style={[styles.tagLabel, { color: theme.colors.text }]}>{tag.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 사진 미리보기 */}
                    {photoUri && (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: photoUri }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.removeButton} onPress={() => setPhotoUri(null)}>
                                <Text style={[styles.removeButtonText, { color: theme.colors.danger }]}>✕ 사진 제거</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 사진 버튼들 */}
                    <View style={styles.photoButtons}>
                        <TouchableOpacity style={[styles.photoButton, { backgroundColor: theme.colors.tint, borderColor: theme.colors.border }]} onPress={pickImage}>
                            <Text style={[styles.photoButtonText, { color: theme.colors.text }]}>🖼 갤러리</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.photoButton, { backgroundColor: theme.colors.tint, borderColor: theme.colors.border }]} onPress={takePhoto}>
                            <Text style={[styles.photoButtonText, { color: theme.colors.text }]}>📷 카메라</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 저장 버튼 */}
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.colors.primary }, isSubmitting && { backgroundColor: theme.colors.primaryLight }]}
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

                {/* 일지 목록 목록 */}
                {memos.length > 0 && (
                    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📋 기록된 일지</Text>
                        {memos.map(memo => (
                            <TouchableOpacity key={memo.id} style={[styles.memoItem, { borderTopColor: theme.colors.border }]} onPress={() => openMemoDetail(memo)}>
                                <Text style={[styles.memoDate, { color: theme.colors.subText }]}>{memo.date}</Text>
                                <Text style={[styles.memoContent, { color: theme.colors.text }]} numberOfLines={3}>{memo.content}</Text>
                                {memo.photoUrl && (
                                    <Image source={{ uri: memo.photoUrl }} style={styles.memoImageThumb} resizeMode="cover" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* 일지 상세/수정 모달 */}
            <Modal visible={!!selectedMemo} transparent={true} animationType="slide" onRequestClose={() => setSelectedMemo(null)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        {selectedMemo && (
                            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                                <View style={styles.modalHeader}>
                                    <View>
                                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>일지 상세내역</Text>
                                        <Text style={[styles.modalDate, { color: theme.colors.subText }]}>{selectedMemo.date}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedMemo(null)} style={styles.modalCloseButton}>
                                        <Text style={[styles.modalCloseText, { color: theme.colors.text }]}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 이미지 영역 (원본 비율 유지 자동 조정) */}
                                {selectedMemo.photoUrl && (
                                    <Image source={{ uri: selectedMemo.photoUrl }} style={styles.modalImage} resizeMode="contain" />
                                )}

                                {/* 내용/수정 영역 */}
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.modalTextArea, { backgroundColor: isDarkMode ? theme.colors.background : '#fff', color: theme.colors.text, borderColor: theme.colors.primary }]}
                                        value={editContent}
                                        onChangeText={setEditContent}
                                        multiline
                                        autoFocus
                                        textAlignVertical="top"
                                    />
                                ) : (
                                    <Text style={[styles.modalTextContent, { color: theme.colors.text }]}>{selectedMemo.content}</Text>
                                )}

                                {/* 액션 버튼들 */}
                                <View style={styles.modalActions}>
                                    {isEditing ? (
                                        <>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.subText }]} onPress={() => setIsEditing(false)}>
                                                <Text style={styles.actionBtnText}>취소</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} onPress={handleUpdate}>
                                                <Text style={styles.actionBtnText}>저장하기</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.secondary }]} onPress={() => setIsEditing(true)}>
                                                <Text style={styles.actionBtnText}>수정</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]} onPress={handleDelete}>
                                                <Text style={styles.actionBtnText}>삭제</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    card: {
        borderRadius: 12, padding: 16,
        borderWidth: 1, marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    dateText: { fontSize: 13, marginBottom: 16 },
    textArea: {
        borderWidth: 1, borderRadius: 8,
        padding: 12, fontSize: 15, minHeight: 120,
    },
    quickTagsContainer: { marginTop: 12 },
    quickTagsLabel: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
    quickTagsList: { gap: 8, paddingRight: 16 },
    tagChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1,
    },
    tagIcon: { fontSize: 14 },
    tagLabel: { fontSize: 13, fontWeight: '500' },
    previewContainer: { marginTop: 12, alignItems: 'center' },
    previewImage: { width: '100%', height: 200, borderRadius: 8 },
    removeButton: { marginTop: 8 },
    removeButtonText: { fontSize: 13, fontWeight: 'bold' },
    photoButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
    photoButton: {
        flex: 1, padding: 14, borderRadius: 8,
        alignItems: 'center', borderWidth: 1,
    },
    photoButtonText: { fontSize: 15, fontWeight: '600' },
    submitButton: {
        padding: 16, borderRadius: 8,
        alignItems: 'center', marginTop: 20,
    },
    submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    memoItem: { borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
    memoDate: { fontSize: 12, marginBottom: 4 },
    memoContent: { fontSize: 14, lineHeight: 20 },
    memoImageThumb: { width: '100%', height: 140, borderRadius: 8, marginTop: 10 },

    // 모달 스타일
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%', minHeight: '50%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    modalDate: { fontSize: 13 },
    modalCloseButton: { padding: 4 },
    modalCloseText: { fontSize: 24, fontWeight: 'bold' },
    modalImage: { width: '100%', height: 250, borderRadius: 8, marginBottom: 16, backgroundColor: '#000' },
    modalTextContent: { fontSize: 16, lineHeight: 24, minHeight: 100 },
    modalTextArea: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 16, minHeight: 150 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'flex-end' },
    actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
