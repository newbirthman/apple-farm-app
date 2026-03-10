import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  pm10: number; // 미세먼지
  pm25: number; // 초미세먼지
  locationName: string; // 현재 위치명
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        // 1. 위치 권한 요청
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('날씨 정보를 보려면 위치 권한이 필요합니다.');
          setIsLoading(false);
          return;
        }

        // 2. 현재 지도 좌표 가져오기 (오차 범위 100m 수준 최적화하여 빠른 속도 확보)
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        // 3. 역방향 지오코딩으로 현재 위치 이름 파악
        let locationName = '현재 위치';
        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (geocode && geocode.length > 0) {
            const place = geocode[0];
            // 1. 객체의 모든 값 문자열 필터링 및 공백 분리
            const values = Object.values(place).filter(v => typeof v === 'string') as string[];
            const allWords = values.flatMap(v => v.split(/\s+/));

            // 2. 숫자가 있든 없든 순수하게 '동', '읍', '면'으로 끝나는 단어를 최우선 탐색 (예: 구서2동)
            let dongEupMyeon = allWords.find(w => /^[가-힣\d]+(동|읍|면)$/.test(w));

            if (dongEupMyeon) {
              locationName = dongEupMyeon;
            } else {
              // 3. 못 찾으면 번지수("32-6", "112") 형식이나 숫자로만 된 값이 아닌 유의미한 지역명(name, district 등)으로 대체
              const validNames = [place.name, place.street, place.district, place.city].filter(v => v && !/^[\d\-]+$/.test(v));
              locationName = validNames[0] || '현재 위치';
            }
          }
        } catch (geoErr) {
          console.warn('역방향 지오코딩 실패:', geoErr);
        }

        // 4. Open-Meteo API 호출 (기상청/글로벌 모델 무료 통합)
        // 날씨, 온도, 주/야간 여부 호출
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`;
        // 미세먼지(PM10), 초미세먼지(PM2.5) 대기질 전용 API 호출
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`;

        const [weatherRes, airRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(airQualityUrl)
        ]);

        const weatherData = await weatherRes.json();
        const airData = await airRes.json();

        if (weatherData.current) {
          setWeather({
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weather_code,
            isDay: weatherData.current.is_day === 1,
            pm10: airData.current?.pm10 ?? 0,
            pm25: airData.current?.pm2_5 ?? 0,
            locationName,
          });
        }
      } catch (error) {
        console.error("날씨 정보 페칭 실패:", error);
        setErrorMsg('날씨 정보를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { weather, isLoading, errorMsg };
}
