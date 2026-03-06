import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useWeather } from '@/hooks/useWeather';

function getWeatherEmoji(code: number, isDay: boolean) {
    // WMO (World Meteorological Organization) 날씨 코드 간이 매핑
    if (code === 0) return isDay ? '☀️' : '🌕'; // 맑음
    if (code === 1 || code === 2 || code === 3) return isDay ? '⛅' : '☁️'; // 구름 조금~많음
    if (code >= 45 && code <= 48) return '🌫️'; // 안개
    if (code >= 51 && code <= 67) return '🌧️'; // 비/이슬비
    if (code >= 71 && code <= 77) return '❄️'; // 눈
    if (code >= 80 && code <= 82) return '🌧️'; // 소나기
    if (code >= 95 && code <= 99) return '⛈️'; // 뇌우
    return '🌡️';
}

function getAirQuality(pm10: number) {
    if (pm10 <= 30) return { label: '좋음', color: '#16a34a', emoji: '🔵' };
    if (pm10 <= 80) return { label: '보통', color: '#2563eb', emoji: '🟢' };
    if (pm10 <= 150) return { label: '나쁨', color: '#d97706', emoji: '🟡' };
    return { label: '매우나쁨', color: '#dc2626', emoji: '🔴' };
}

export default function WeatherWidget() {
    const { weather, isLoading, errorMsg } = useWeather();

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#16a34a" />
                <Text style={styles.loadingText}>지역 날씨 파악 중...</Text>
            </View>
        );
    }

    if (errorMsg || !weather) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>{errorMsg || '날씨를 불러올 수 없습니다.'}</Text>
            </View>
        );
    }

    const weatherEmoji = getWeatherEmoji(weather.weatherCode, weather.isDay);
    const airQuality = getAirQuality(weather.pm10);

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {/* 왼쪽: 기온 및 날씨 */}
                <View style={styles.weatherBox}>
                    <Text style={styles.emoji}>{weatherEmoji}</Text>
                    <View>
                        <Text style={styles.temp}>{weather.temperature}°C</Text>
                        <Text style={styles.subText}>현재 날씨</Text>
                    </View>
                </View>

                {/* 세로 구분선 */}
                <View style={styles.divider} />

                {/* 오른쪽: 미세먼지 정보 */}
                <View style={styles.airBox}>
                    <View style={styles.airRow}>
                        <Text style={styles.airLabel}>미세먼지</Text>
                        <Text style={[styles.airStat, { color: airQuality.color }]}>
                            {airQuality.emoji} {airQuality.label} ({weather.pm10}㎍)
                        </Text>
                    </View>
                    <View style={styles.airRow}>
                        <Text style={styles.airLabel}>초미세먼지</Text>
                        <Text style={styles.airStatVal}>{weather.pm25} ㎍/m³</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
        marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
    },
    center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
    loadingText: { marginTop: 8, fontSize: 13, color: '#6b7280' },
    errorText: { fontSize: 13, color: '#ef4444' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    weatherBox: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    emoji: { fontSize: 38 },
    temp: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
    subText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    divider: { width: 1, height: '80%', backgroundColor: '#e5e7eb', marginHorizontal: 16 },
    airBox: { flex: 1.2, gap: 6 },
    airRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    airLabel: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
    airStat: { fontSize: 13, fontWeight: 'bold' },
    airStatVal: { fontSize: 13, color: '#374151', fontWeight: 'bold' }
});
