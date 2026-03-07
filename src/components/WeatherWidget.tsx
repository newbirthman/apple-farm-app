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

function getAirQuality(pm10: number) {
    if (pm10 <= 30) return { label: '좋음', color: '#16a34a', emoji: '🔵' };
    if (pm10 <= 80) return { label: '보통', color: '#2563eb', emoji: '🟢' };
    if (pm10 <= 150) return { label: '나쁨', color: '#d97706', emoji: '🟡' };
    return { label: '매우나쁨', color: '#dc2626', emoji: '🔴' };
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
    const airQuality = getAirQuality(weather.pm10);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.row}>
                {/* 왼쪽: 기온 및 날씨 */}
                <View style={styles.weatherBox}>
                    <Text style={styles.emoji}>{weatherEmoji}</Text>
                    <View>
                        <Text style={[styles.temp, { color: theme.colors.text }]}>{weather.temperature}°C</Text>
                        <Text style={{ fontSize: 11, color: theme.colors.subText, marginTop: 2 }} numberOfLines={1}>📍 {weather.locationName}</Text>
                    </View>
                </View>

                {/* 세로 구분선 */}
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                {/* 오른쪽: 미세먼지 정보 */}
                <View style={styles.airBox}>
                    <View style={styles.airRow}>
                        <Text style={[styles.airLabel, { color: theme.colors.subText }]}>미세먼지</Text>
                        <Text style={[styles.airStat, { color: airQuality.color }]}>
                            {airQuality.emoji} {airQuality.label} ({weather.pm10}㎍)
                        </Text>
                    </View>
                    <View style={styles.airRow}>
                        <Text style={[styles.airLabel, { color: theme.colors.subText }]}>초미세먼지</Text>
                        <Text style={[styles.airStatVal, { color: theme.colors.text }]}>{weather.pm25} ㎍/m³</Text>
                    </View>
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
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    weatherBox: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    emoji: { fontSize: 38 },
    temp: { fontSize: 22, fontWeight: 'bold' },
    divider: { width: 1, height: '80%', marginHorizontal: 16 },
    airBox: { flex: 1.2, gap: 6 },
    airRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    airLabel: { fontSize: 13, fontWeight: '500' },
    airStat: { fontSize: 13, fontWeight: 'bold' },
    airStatVal: { fontSize: 13, fontWeight: 'bold' }
});
