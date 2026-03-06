import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  pm10: number; // 미세먼지
  pm25: number; // 초미세먼지
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

        // 3. Open-Meteo API 호출 (기상청/글로벌 모델 무료 통합)
        // 날씨, 온도, 주/야간 여부, 미세먼지(PM10), 초미세먼지(PM2.5) 동시 호출
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&hourly=pm10,pm2_5&timezone=auto`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.current) {
            // 현재 시간을 바탕으로 hourly 배열에서 가장 최신 PM10, PM2.5 값을 가져옵니다.
            const nowHour = new Date().getHours();
            
            setWeather({
              temperature: data.current.temperature_2m,
              weatherCode: data.current.weather_code,
              isDay: data.current.is_day === 1,
              pm10: data.hourly?.pm10?.[nowHour] ?? 0,
              pm25: data.hourly?.pm2_5?.[nowHour] ?? 0,
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
