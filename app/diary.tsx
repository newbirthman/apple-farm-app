import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Modal, RefreshControl
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

interface MemoEntry {
    id: string;
    date: string;
    content: string;
    photoUrl?: string;
    created_at?: string;
}

interface TaskEntry {
    id: string;
    content: string;
    done: boolean;
    created_at?: string;
}

export default function DiaryScreen() {
    const [memos, setMemos] = useState<MemoEntry[]>([]);
    const [content, setContent] = useState('');
    const [photoUris, setPhotoUris] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 모달 및 상세보기 상태
    const [selectedMemo, setSelectedMemo] = useState<MemoEntry | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // 하위 탭 스위칭 상태 ('todo' = 오늘 할일, 'records' = 작업일지)
    const [activeTab, setActiveTab] = useState<'todo' | 'records'>('todo');

    // 풀스크린 이미지 모달 상태
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    // 할일 (Tasks) 상태
    const [tasks, setTasks] = useState<TaskEntry[]>([]);
    const [newTask, setNewTask] = useState('');
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

    // 테마 임포트
    const { theme, isDarkMode } = useTheme();
    const today = new Date().toISOString().split('T')[0];

    // ========== Supabase에서 데이터 가져오기 ==========
    const fetchMemos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('memos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('fetchMemos 에러:', JSON.stringify(error));
                Alert.alert('불러오기 실패', '영농일지를 불러오지 못했습니다.\n' + error.message);
                return;
            }

            if (data) {
                const formattedMemos: MemoEntry[] = data.map((item: any) => {
                    let photoUrl = item.photo_url || undefined;
                    // React Native <Image> 컴포넌트는 상대경로를 인식하지 못하므로, 풀 URL로 파싱
                    if (photoUrl) {
                        photoUrl = photoUrl.split(',').map((url: string) => {
                            const trimmed = url.trim();
                            if (trimmed.startsWith('/')) {
                                return `https://apple-farm-138.pages.dev${trimmed}`;
                            }
                            return trimmed;
                        }).join(',');
                    }

                    return {
                        id: String(item.id),
                        date: item.date || '',
                        content: item.content || '',
                        photoUrl: photoUrl,
                        created_at: item.created_at,
                    };
                });
                console.log('불러온 일지 데이터 예시 (최상단 1개):', formattedMemos[0]);
                setMemos(formattedMemos);
            }
        } catch (err: any) {
            console.error('fetchMemos 예외:', err.message);
        }
    }, []);

    // ========== Supabase에서 할일 가져오기 ==========
    const fetchTasks = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('done', { ascending: true }) // 미완료 먼저
                .order('created_at', { ascending: false });

            if (error) {
                console.error('fetchTasks 에러:', JSON.stringify(error));
                return;
            }
            if (data) {
                setTasks(data);
            }
        } catch (err: any) {
            console.error('fetchTasks 예외:', err.message);
        }
    }, []);

    // 최초 화면 진입 시 데이터 로드
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            await Promise.all([fetchMemos(), fetchTasks()]);
            setIsLoading(false);
        })();
    }, [fetchMemos, fetchTasks]);

    // 당겨서 새로고침
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchMemos(), fetchTasks()]);
        setRefreshing(false);
    }, [fetchMemos, fetchTasks]);

    // ========== 빠른 입력 태그 ==========
    const QUICK_TAGS = [
        { icon: '🍂', label: '거름', text: '과수원 밑거름(퇴비) 살포 작업 진행.' },
        { icon: '✂️', label: '전정', text: '웃자란 가지 전정(가지치기) 진행.' },
        { icon: '🌳', label: '식재', text: '사과나무 묘목 식재 작업 진행.' },
        { icon: '💊', label: '방제/농약', text: '병해충 방제 작업 진행함.' },
        { icon: '🌿', label: '제초', text: '과수원 잡초 제거(제초) 작업 진행.' },
        { icon: '🌱', label: '비료', text: '웃거름 살포 작업 진행.' },
        { icon: '💧', label: '물주기', text: '과수원 전체 관수 작업 진행.' },
        { icon: '🌸', label: '적화', text: '불필요한 꽃눈 제거(적화) 작업 진행.' },
        { icon: '🍏', label: '적과', text: '불량 및 과다 열매 솎아내기(적과) 진행.' },
        { icon: '🍃', label: '적엽', text: '햇빛을 가리는 잎따기(적엽) 작업 진행.' },
        { icon: '🍎', label: '수확', text: '사과 수확 및 선별 작업 중.' },
        { icon: '📦', label: '포장/출하', text: '주문 건 포장 및 택배 발송 처리.' },
        { icon: '🧃', label: '가공', text: '사과즙 등 가공품 생산 작업 진행.' }
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

    const handleQuickTaskTag = (tagText: string) => {
        setNewTask(tagText);
    };

    // ========== 사진 선택/촬영 (다중) ==========
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // 다중 선택 시에는 editing false 권장
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // null 방생 대비 및 방어적인 map 처리
            const newUris = result.assets
                .map(asset => asset.uri)
                .filter(uri => Boolean(uri));

            if (newUris.length > 0) {
                setPhotoUris(prev => [...prev, ...newUris]);
            }
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (uri) {
                setPhotoUris(prev => [...prev, uri]);
            }
        }
    };

    const removePhoto = (indexToRemove: number) => {
        setPhotoUris(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // ========== R2로 사진 업로드 ==========
    const uploadPhoto = async (uri: string): Promise<string | null> => {
        try {
            const filename = uri.split('/').pop() || `diary_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            const formData = new FormData();
            formData.append('photo', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type: type,
            } as any);

            const uploadRes = await fetch('https://apple-farm-138.pages.dev/api/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                return data.url || null;
            } else {
                const errText = await uploadRes.text();
                console.error('사진 업로드 응답 에러:', errText);
                /* 서버 에러를 바로 파악할 수 있도록 Alert 노출 */
                Alert.alert('사진 업로드 실패', `서버 응답 오류: ${errText}`);
                return null;
            }
        } catch (err: any) {
            console.error('사진 업로드 오류:', err.message);
            Alert.alert('사진 업로드 오류', err.message);
            return null;
        }
    };

    // ========== 일지 저장 ==========
    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert('입력 오류', '일지 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedUrls: string[] = [];

            if (photoUris.length > 0) {
                // 여러 장의 이미지를 순차적으로 업로드 (병렬 Promise.all 사용시 한 번에 많은 네트워크 요청으로 인해 에러 발생 가능성 방지)
                for (const uri of photoUris) {
                    try {
                        const url = await uploadPhoto(uri);
                        if (url) {
                            uploadedUrls.push(url);
                        }
                    } catch (uploadErr) {
                        console.error('개별 사진 업로드 중 오류 발생:', uploadErr);
                    }
                }
            }

            const finalPhotoUrlString = uploadedUrls.length > 0 ? uploadedUrls.join(',') : null;

            const { error } = await supabase
                .from('memos')
                .insert([{
                    date: today,
                    content: content.trim(),
                    photo_url: finalPhotoUrlString

                }]);

            if (error) {
                Alert.alert('저장 실패', '데이터베이스 오류:\n' + error.message + '\n코드: ' + error.code);
                return;
            }

            setContent('');
            setPhotoUris([]);

            // 저장 완료 후 목록 즉시 갱신
            await fetchMemos();
            Alert.alert('저장 완료', '영농일지가 기록되었습니다.');
        } catch (err: any) {
            Alert.alert('오류', '저장에 실패했습니다: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========== 일지 수정 ==========
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

            if (error) {
                Alert.alert('수정 실패', '데이터베이스 오류:\n' + error.message + '\n코드: ' + error.code);
                return;
            }

            setIsEditing(false);
            setSelectedMemo(null);
            // 수정 완료 후 목록 즉시 갱신
            await fetchMemos();
            Alert.alert('수정 완료', '일지가 수정되었습니다.');
        } catch (err: any) {
            Alert.alert('오류', '수정에 실패했습니다: ' + err.message);
        }
    };

    // ========== 일지 삭제 ==========
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

                        if (error) {
                            Alert.alert('삭제 실패', '데이터베이스 오류:\n' + error.message + '\n코드: ' + error.code);
                            return;
                        }

                        setSelectedMemo(null);
                        // 삭제 완료 후 목록 즉시 갱신
                        await fetchMemos();
                        Alert.alert('삭제 완료', '일지가 삭제되었습니다.');
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

    // ========== 할일(Task) 핸들러 ==========
    const addTask = async () => {
        if (!newTask.trim()) {
            Alert.alert('입력 오류', '할일 내용을 입력해주세요.');
            return;
        }
        setIsTaskSubmitting(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .insert([{ content: newTask.trim(), done: false }]);

            if (error) {
                Alert.alert('저장 실패', '할일 등록 오류:\n' + error.message);
                return;
            }
            setNewTask('');
            await fetchTasks();
        } catch (err: any) {
            Alert.alert('오류', '할일 저장 실패: ' + err.message);
        } finally {
            setIsTaskSubmitting(false);
        }
    };

    const toggleTask = async (task: TaskEntry) => {
        const previousDone = task.done;
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !previousDone } : t));
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ done: !previousDone })
                .eq('id', task.id);

            if (error) {
                Alert.alert('수정 실패', error.message);
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: previousDone } : t));
            }
        } catch (err: any) {
            Alert.alert('오류', err.message);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: previousDone } : t));
        }
    };

    const deleteTask = (id: string) => {
        Alert.alert('삭제 확인', '이 할일을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    try {
                        const { error } = await supabase.from('tasks').delete().eq('id', id);
                        if (error) {
                            Alert.alert('삭제 실패', error.message);
                            return;
                        }
                        setTasks(prev => prev.filter(t => t.id !== id));
                    } catch (err: any) {
                        Alert.alert('오류', err.message);
                    }
                }
            }
        ]);
    };

    const deleteAllTasks = () => {
        if (tasks.length === 0) {
            Alert.alert('알림', '삭제할 할 일이 없습니다.');
            return;
        }
        Alert.alert('전체 삭제 확인', '등록된 모든 할 일을 초기화(삭제) 하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '모두 삭제', style: 'destructive', onPress: async () => {
                    try {
                        // 조건 없이 모두 삭제하기 위해 현재 사용자의 모든 데이터 삭제 (여기서는 id를 기반으로 가져온 tasks 전체에 대해 IN 또는 Neq null 등 활용)
                        // 주의: 테스트 환경에서는 테이블 전체를 비워버릴 위험성이 있으므로 IN 연산자로 현재 목록에 있는 아이디들만 삭제
                        const taskIds = tasks.map(t => t.id);
                        const { error } = await supabase.from('tasks').delete().in('id', taskIds);

                        if (error) {
                            Alert.alert('삭제 실패', error.message);
                            return;
                        }
                        setTasks([]);
                        Alert.alert('삭제 완료', '모든 할 일이 삭제되었습니다.');
                    } catch (err: any) {
                        Alert.alert('오류', err.message);
                    }
                }
            }
        ]);
    };

    return (
        <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* 상단 서브 탭 메뉴 */}
            <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'todo' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('todo')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'todo' ? theme.colors.primary : theme.colors.subText }]}>작업입력</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'records' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('records')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'records' ? theme.colors.primary : theme.colors.subText }]}>작업일지</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
            >
                {activeTab === 'todo' ? (
                    <>
                        {/* 일지 작성 카드 */}
                        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📝 오늘 한일</Text>
                            <Text style={[styles.dateText, { color: theme.colors.subText }]}>{today}</Text>

                            <TextInput
                                style={[styles.textArea, { backgroundColor: isDarkMode ? theme.colors.background : '#fff', color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={content}
                                onChangeText={setContent}
                                placeholder="오늘 한 작업, 날씨, 메모 등을 자유롭게 기록하세요..."
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

                            {/* 멀티 사진 미리보기 */}
                            {photoUris.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewContainer} contentContainerStyle={styles.previewContent}>
                                    {photoUris.map((uri, idx) => (
                                        <View key={`preview-${idx}`} style={{ marginRight: 8, position: 'relative' }}>
                                            <Image source={{ uri }} style={styles.previewImage} />
                                            <TouchableOpacity style={[styles.removeButton, { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 12 }]} onPress={() => removePhoto(idx)}>
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
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

                        {/* 할일 섹션 */}
                        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>✅ 앞으로 할일</Text>
                                <TouchableOpacity onPress={deleteAllTasks} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 할일용 빠른 입력 태그 모음 */}
                            <View style={[styles.quickTagsContainer, { marginTop: 8, marginBottom: 8 }]}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTagsList}>
                                    {QUICK_TAGS.map((tag, idx) => (
                                        <TouchableOpacity
                                            key={`task-tag-${idx}`}
                                            style={[styles.tagChip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                                            onPress={() => handleQuickTaskTag(tag.text)}
                                        >
                                            <Text style={styles.tagIcon}>{tag.icon}</Text>
                                            <Text style={[styles.tagLabel, { color: theme.colors.text }]}>{tag.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={[styles.inputRow, { marginBottom: 16 }]}>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDarkMode ? theme.colors.background : '#fff', color: theme.colors.text, borderColor: theme.colors.border }]}
                                    value={newTask}
                                    onChangeText={setNewTask}
                                    placeholder="단기 작업이나 할 일을 기록하세요..."
                                    placeholderTextColor={theme.colors.subText}
                                    returnKeyType="done"
                                    onSubmitEditing={addTask}
                                />
                                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={addTask} disabled={isTaskSubmitting}>
                                    {isTaskSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addButtonText}>추가</Text>}
                                </TouchableOpacity>
                            </View>

                            {tasks.length > 0 ? (
                                tasks.map(item => (
                                    <TouchableOpacity key={item.id} style={[styles.taskItem, { borderTopColor: theme.colors.border }]} onPress={() => toggleTask(item)} onLongPress={() => deleteTask(item.id)}>
                                        <View style={[styles.checkbox, item.done && styles.checkboxDone, item.done ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : { borderColor: theme.colors.border }]}>
                                            {item.done && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.taskText, item.done && styles.taskTextDone, { color: item.done ? theme.colors.subText : theme.colors.text }]}>{item.content}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.emptyText, { color: theme.colors.subText }]}>등록된 할 일이 없습니다.</Text>
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        {/* 로딩 표시 */}
                        {isLoading && (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.subText, marginTop: 8 }}>일지를 불러오는 중...</Text>
                            </View>
                        )}

                        {/* 일지 목록 (작업일지 탭에서만 보임) */}
                        {!isLoading && memos.length > 0 && (
                            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📋 기록된 일지 ({memos.length}건)</Text>
                                {memos.map(memo => (
                                    <View key={memo.id} style={[styles.memoItem, { borderTopColor: theme.colors.border }]}>
                                        <TouchableOpacity onPress={() => openMemoDetail(memo)}>
                                            <Text style={[styles.memoDate, { color: theme.colors.subText }]}>{memo.date}</Text>
                                            <Text style={[styles.memoContent, { color: theme.colors.text }]} numberOfLines={3}>{memo.content}</Text>
                                        </TouchableOpacity>
                                        {memo.photoUrl && (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                                {memo.photoUrl.split(',').map((url, idx) => (
                                                    <TouchableOpacity key={`thumb-${memo.id}-${idx}`} onPress={() => openMemoDetail(memo)}>
                                                        <Image source={{ uri: url }} style={[styles.memoImageThumb, { marginRight: 8 }]} resizeMode="cover" />
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* 데이터 없을 때 */}
                        {!isLoading && memos.length === 0 && (
                            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, alignItems: 'center', padding: 32 }]}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>🌿</Text>
                                <Text style={[styles.sectionTitle, { color: theme.colors.subText, textAlign: 'center' }]}>아직 기록된 일지가 없습니다</Text>
                            </View>
                        )}
                    </>
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

                                {/* 이미지 영역 */}
                                {selectedMemo.photoUrl && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                                        {selectedMemo.photoUrl.split(',').map((url, idx) => (
                                            <TouchableOpacity key={`modal-img-${idx}`} onPress={() => setFullScreenImage(url)}>
                                                <Image source={{ uri: url }} style={[styles.modalImage, { marginRight: 12 }]} resizeMode="contain" />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
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

            {/* 전체화면 이미지 뷰어 모달 */}
            <Modal visible={!!fullScreenImage} transparent={true} animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
                <View style={styles.fullScreenOverlay}>
                    <TouchableOpacity style={styles.fullScreenCloseBtn} onPress={() => setFullScreenImage(null)}>
                        <Text style={styles.fullScreenCloseText}>✕</Text>
                    </TouchableOpacity>
                    {fullScreenImage && (
                        <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, backgroundColor: '#fff' },
    tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 16, fontWeight: 'bold' },
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
    previewContainer: { marginTop: 12 },
    previewContent: { alignItems: 'center' },
    previewImage: { width: 140, height: 140, borderRadius: 8 },
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

    // 할일 관련 스타일 모음
    inputRow: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
    addButton: { paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    taskItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    checkboxDone: {},
    taskText: { fontSize: 15 },
    taskTextDone: { textDecorationLine: 'line-through' },
    emptyText: { textAlign: 'center', padding: 16, fontSize: 14 },

    memoItem: { borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
    memoDate: { fontSize: 12, marginBottom: 4 },
    memoContent: { fontSize: 14, lineHeight: 20 },
    memoImageThumb: { width: 140, height: 140, borderRadius: 8, marginTop: 10 },

    // 모달 스타일
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%', minHeight: '50%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    modalDate: { fontSize: 13 },
    modalCloseButton: { padding: 4 },
    modalImage: { width: 300, height: 300, borderRadius: 8 },
    modalTextArea: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 16, minHeight: 150 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'flex-end' },
    actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // 풀스크린 뷰어 스타일
    fullScreenOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    fullScreenCloseBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 },
    fullScreenCloseText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    fullScreenImage: { width: '100%', height: '100%' },
});
