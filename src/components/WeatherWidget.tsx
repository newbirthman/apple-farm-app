import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useWeather } from '@/hooks/useWeather';
import { useTheme } from '@/contexts/ThemeContext';

function getWeatherEmoji(code: number, isDay: boolean) {
    if (code === 0) return isDay ? '☀️' : '🌕';
    if (code === 1 || code === 2 || code === 3) return isDay ? '⛅' : '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌡️';
}

function getAirQuality(type: 'pm10' | 'pm25', value: number) {
    if (type === 'pm10') {
        if (value <= 30) return { label: '좋음', color: '#16a34a', emoji: '🔵' };
        if (value <= 80) return { label: '보통', color: '#2563eb', emoji: '🟢' };
        if (value <= 150) return { label: '나쁨', color: '#d97706', emoji: '🟡' };
        return { label: '매우나쁨', color: '#dc2626', emoji: '🔴' };
    } else {
        if (value <= 15) return { label: '좋음', color: '#16a34a', emoji: '🔵' };
        if (value <= 35) return { label: '보통', color: '#2563eb', emoji: '🟢' };
        if (value <= 75) return { label: '나쁨', color: '#d97706', emoji: '🟡' };
        return { label: '매우나쁨', color: '#dc2626', emoji: '🔴' };
    }
}

export default function WeatherWidget() {
    const { weather, isLoading, errorMsg } = useWeather();
    const { theme } = useTheme();

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={{ marginTop: 8, fontSize: 13, color: theme.colors.subText }}>지역 날씨 파악 중...</Text>
            </View>
        );
    }

    if (errorMsg || !weather) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={{ fontSize: 13, color: theme.colors.danger }}>{errorMsg || '날씨를 불러올 수 없습니다.'}</Text>
            </View>
        );
    }

    const weatherEmoji = getWeatherEmoji(weather.weatherCode, weather.isDay);
    const air10 = getAirQuality('pm10', weather.pm10);
    const air25 = getAirQuality('pm25', weather.pm25);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {/* 1. 상단: 기온 및 날씨 */}
            <View style={styles.weatherBox}>
                <Text style={styles.emoji}>{weatherEmoji}</Text>
                <Text style={[styles.temp, { color: theme.colors.text }]} adjustsFontSizeToFit numberOfLines={1}>{weather.temperature}°C</Text>
                <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600', marginLeft: 6 }} numberOfLines={1}>{weather.locationName}</Text>
            </View>

            {/* 가로 구분선 */}
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* 2. 하단: 미세먼지 정보 */}
            <View style={styles.airBox}>
                <View style={styles.airRow}>
                    <Text style={[styles.airLabel, { color: theme.colors.subText }]} adjustsFontSizeToFit numberOfLines={1}>미세먼지</Text>
                    <Text style={[styles.airStat, { color: air10.color }]} adjustsFontSizeToFit numberOfLines={1}>
                        {air10.emoji} {air10.label} ({weather.pm10} ㎍/m³)
                    </Text>
                </View>
                <View style={styles.airRow}>
                    <Text style={[styles.airLabel, { color: theme.colors.subText }]} adjustsFontSizeToFit numberOfLines={1}>초미세먼지</Text>
                    <Text style={[styles.airStat, { color: air25.color }]} adjustsFontSizeToFit numberOfLines={1}>
                        {air25.emoji} {air25.label} ({weather.pm25} ㎍/m³)
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16, padding: 16,
        marginBottom: 20, borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
    },
    center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
    // 날씨 영역 (상단)
    weatherBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    emoji: { fontSize: 36, marginRight: 4 },
    temp: { fontSize: 26, fontWeight: 'bold' },
    // 구분선 (가로형)
    divider: { height: 1, width: '100%', marginBottom: 16 },
    // 대기질 영역 (하단)
    airBox: { gap: 10 },
    airRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
    airLabel: { fontSize: 14, fontWeight: '600', width: 80, color: '#6b7280' },
    airStat: { fontSize: 14, fontWeight: '700' }
});
