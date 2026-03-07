import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// 테마에 사용할 색상 스키마 정의
export const lightTheme = {
    isDark: false,
    colors: {
        background: '#f0fdf4',        // 화사한 민트/그린빛 밝은 배경 (농장의 아침)
        card: '#ffffff',              // 깔끔한 순백색 카드 (가독성 유지)
        text: '#14532d',              // 진한 숲색 텍스트 (다크 그린)
        subText: '#4b5563',           // 회색빛이 도는 보조 텍스트
        border: '#bbf7d0',            // 싱그러운 연두색 테두리
        primary: '#16a34a',           // 🍎 산뜻한 사과 농장 초록 (메인 포인트)
        primaryLight: '#dcfce7',      // 연한 초록색 바탕
        secondary: '#f97316',         // 🍊 상큼한 오렌지 포인트 (서브 컬러)
        tint: '#bbf7d0',              // 비활성 버튼 등
        success: '#16a34a',
        danger: '#dc2626',
    },
};

export const darkTheme = {
    isDark: true,
    colors: {
        background: '#121212',        // 완전한 검정 대신 부드러운 다크 그레이
        card: '#1e1e1e',              // 패널용 다크 색상
        text: '#f3f4f6',              // 가독성 좋은 밝은 회색 텍스트
        subText: '#9ca3af',           // 보조 텍스트 
        border: '#2db3d',             // 테두리용 어두운 선 (오타 수정: #2d3748 등)
        borderDark: '#374151',
        primary: '#4ade80',           // 🍎 다크모드에서 눈에 띄는 화사한 민트 그린
        primaryLight: '#064e3b',      // 어두운 그린 배경
        secondary: '#f97316',         // 다크모드용 밝은 오렌지 
        tint: '#374151',
        success: '#22c55e',
        danger: '#f87171',
    },
};

// 1. 타입 지정
type ThemeType = typeof lightTheme;

interface ThemeContextProps {
    theme: ThemeType;
    toggleTheme: () => void;
    isDarkMode: boolean;
}

// 2. 초기 Context 생성
const ThemeContext = createContext<ThemeContextProps>({
    theme: lightTheme,
    toggleTheme: () => { },
    isDarkMode: false,
});

// 3. Provider 컴포넌트 생성
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
    const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');

    // 모드 전환 함수
    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    const theme = isDarkMode ? { ...darkTheme, colors: { ...darkTheme.colors, border: '#374151' } } : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

// 4. Custom Hook으로 쉽게 불러다 쓰기
export const useTheme = () => useContext(ThemeContext);
