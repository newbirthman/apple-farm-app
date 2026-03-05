// 사과 재배 워크플로우 핵심 데이터
export type SeasonId = 'winter' | 'spring' | 'summer' | 'autumn';

export interface FarmTask {
    id: string;
    title: string;
    period: string;
    icon: string; // lucide-react 아이콘 이름
    urgency: '높음' | '보통' | '낮음';
    methods: string[];
    cautions: string[];
}

export interface SeasonData {
    id: SeasonId;
    name: string;
    months: number[];
    emoji: string;
    color: string;        // 테마 색상 (Tailwind class)
    bgColor: string;      // 배경색
    borderColor: string;  // 테두리색
    textColor: string;    // 텍스트 색
    tasks: FarmTask[];
}

export const seasons: SeasonData[] = [
    {
        id: 'winter',
        name: '겨울',
        months: [12, 1, 2],
        emoji: '❄️',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-400',
        textColor: 'text-blue-800',
        tasks: [
            {
                id: 'w1',
                title: '정지 전정',
                period: '12월 ~ 2월',
                icon: 'Scissors',
                urgency: '높음',
                methods: [
                    '도장지, 역지, 평행지, 교차지 제거',
                    '주간부 중심으로 3~4개 주지 배치',
                    '수관 내부에 햇빛이 고르게 들어오도록 정리',
                    '전정 도구는 사용 전후 소독 철저'
                ],
                cautions: [
                    '지나친 강전정은 도장지 발생을 촉진하므로 주의',
                    '전정 후 절단면에는 반드시 도포제를 발라줄 것',
                    '화상병 발생 지역은 전정 도구 이동 시 소독 필수'
                ]
            },
            {
                id: 'w2',
                title: '기비(밑거름) 시비',
                period: '12월 ~ 1월',
                icon: 'Leaf',
                urgency: '높음',
                methods: [
                    '토양 검정 결과에 따른 맞춤 시비',
                    '퇴비 + 유기질 비료 중심으로 투입',
                    '수관 하부 전체에 골고루 살포 후 얕게 경운',
                    '10a당 퇴비 1,500~2,000kg 기준'
                ],
                cautions: [
                    '질소 과다 시비는 수세 과다 및 품질 저하 유발',
                    '미숙 퇴비 사용 시 뿌리 장해 발생 가능',
                    '석회, 붕소 등 미량원소 부족 여부도 점검할 것'
                ]
            },
            {
                id: 'w3',
                title: '화상병 예방 소독',
                period: '1월 ~ 2월',
                icon: 'ShieldCheck',
                urgency: '보통',
                methods: [
                    '석회유황합제 또는 기계유유제 살포',
                    '수간부, 주지, 부주지 위주로 꼼꼼하게 도포',
                    '기온 0℃ 이상(상해 방지)일 때 작업',
                    '월동 해충(진딧물, 응애) 동시 방제 효과'
                ],
                cautions: [
                    '약제 혼용 시 약해 발생 가능성 주의',
                    '바람이 강한 날은 살포를 피할 것',
                    '눈, 피부 보호장구 반드시 착용'
                ]
            }
        ]
    },
    {
        id: 'spring',
        name: '봄',
        months: [3, 4, 5],
        emoji: '🌸',
        color: 'pink',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-400',
        textColor: 'text-pink-800',
        tasks: [
            {
                id: 's1',
                title: '발아기 방제',
                period: '3월 중순 ~ 4월 초',
                icon: 'Bug',
                urgency: '높음',
                methods: [
                    '발아 전 기계유유제 + 살균제 혼용 살포',
                    '진딧물, 잎말이나방 동시 방제',
                    '붉은별무늬병 예방을 위한 살균제 살포',
                    '방제 적기를 놓치지 않도록 발아 상태 매일 확인'
                ],
                cautions: [
                    '발아 후 기계유유제 사용 시 약해 발생',
                    '방제 시기가 늦으면 해충 밀도 급증',
                    '강우 전에 살포하여 약효를 확보할 것'
                ]
            },
            {
                id: 's2',
                title: '적화 및 적과',
                period: '4월 ~ 5월',
                icon: 'Flower2',
                urgency: '높음',
                methods: [
                    '만개 후 꽃 솎기(중심화만 남기고 제거)',
                    '약제 적화(석회유황합제 희석 살포) 활용',
                    '6월 낙과 후 최종 적과(마무리 적과)',
                    '주당 착과량 기준: 후지 200~250과 / 홍로 150~200과'
                ],
                cautions: [
                    '적화/적과가 늦으면 과일 크기와 당도 저하',
                    '중심과 중심으로 남기되 기형과는 즉시 제거',
                    '과다 착과 시 이듬해 결실 불량(해거리) 발생'
                ]
            },
            {
                id: 's3',
                title: '냉해(서리) 방지 관리',
                period: '3월 ~ 4월',
                icon: 'Thermometer',
                urgency: '높음',
                methods: [
                    '기상청 서리 예보 확인 및 미리 대비',
                    '방상팬(서리 방지 팬) 가동',
                    '미세 살수법(스프링클러)으로 어는점 이상 유지',
                    '연소법: 과원 내 연기 발생으로 복사 냉각 방지'
                ],
                cautions: [
                    '서리는 새벽 4~6시에 집중되므로 야간 감시 필요',
                    '방상팬 고장 여부 사전 점검 필수',
                    '꽃봉오리 시기 -2℃ 이하에서 동해 발생'
                ]
            }
        ]
    },
    {
        id: 'summer',
        name: '여름',
        months: [6, 7, 8],
        emoji: '☀️',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-400',
        textColor: 'text-green-800',
        tasks: [
            {
                id: 'su1',
                title: '하계 전정',
                period: '6월 ~ 7월',
                icon: 'TreeDeciduous',
                urgency: '보통',
                methods: [
                    '도장지 제거로 수관 내부 통풍/채광 확보',
                    '열매 주변 잎은 남겨 과실 비대를 도움',
                    '필요 이상의 강전정은 삼가고 가볍게 정리',
                    '수형 유지를 위한 유인(줄로 가지 고정) 병행'
                ],
                cautions: [
                    '장마 전에 완료하여 병해 감염 기회를 줄일 것',
                    '고온기 강전정은 일소 피해 유발 가능',
                    '전정 후 절단면 도포 잊지 말 것'
                ]
            },
            {
                id: 'su2',
                title: '탄저병·갈색무늬병 방제',
                period: '6월 ~ 8월',
                icon: 'Shield',
                urgency: '높음',
                methods: [
                    '장마 전 예방 살균제 살포 (7~10일 간격)',
                    '강우 후 즉시 추가 방제 실시',
                    '탄저병: 만코제브, 프로피네브 계열 약제',
                    '갈색무늬병: 디티아논, 캡탄 등 혼용'
                ],
                cautions: [
                    '장마철 연속 강우 시 방제 시기 놓치기 쉬움',
                    '같은 계열 약제 반복 사용 시 내성 발생',
                    '수확 전 안전 사용 기준 반드시 준수'
                ]
            },
            {
                id: 'su3',
                title: '관수(물 관리)',
                period: '6월 ~ 8월',
                icon: 'Droplets',
                urgency: '보통',
                methods: [
                    '토양 수분 텐시오미터로 관수 시기 판단(pF 2.5~2.7)',
                    '점적관수 또는 미니스프링클러 방식 추천',
                    '1회 관수량: 20~30mm, 주 2~3회 기준',
                    '폭염 시 수관 미세 살수로 엽온 저하'
                ],
                cautions: [
                    '과습은 뿌리 질식 및 역병 유발',
                    '수확 직전 과다 관수 시 열과(과실 갈라짐) 발생',
                    '건조 스트레스도 과실 비대 불량의 원인'
                ]
            }
        ]
    },
    {
        id: 'autumn',
        name: '가을',
        months: [9, 10, 11],
        emoji: '🍎',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-400',
        textColor: 'text-red-800',
        tasks: [
            {
                id: 'a1',
                title: '착색 관리 (잎 따기 · 반사필름)',
                period: '9월 ~ 10월',
                icon: 'Palette',
                urgency: '높음',
                methods: [
                    '수확 30~40일 전부터 과실 주변 잎 따기 시작',
                    '1차: 과실을 가리는 잎만, 2차: 과실 주변까지 확대',
                    '반사필름(은색 멀칭) 나무 아래 피복하여 하단 착색 유도',
                    '과실 돌리기: 색이 안 든 면을 햇빛 쪽으로 회전'
                ],
                cautions: [
                    '잎을 너무 많이 제거하면 광합성 저하 → 당도 하락',
                    '고온기(9월 초) 과도한 잎 따기는 일소 피해 유발',
                    '반사필름은 바람에 날리지 않도록 고정 철저'
                ]
            },
            {
                id: 'a2',
                title: '수확 및 등급 분류',
                period: '10월 ~ 11월',
                icon: 'Apple',
                urgency: '높음',
                methods: [
                    '품종별 적기 수확: 홍로(9월 말), 후지(10월 말~11월)',
                    '과실 꼭지를 위로 향하게 하여 수확(꼭지 빠짐 방지)',
                    '수확 후 즉시 예냉(예비 냉각)하여 신선도 유지',
                    '크기, 색도, 당도별 등급 분류 후 포장'
                ],
                cautions: [
                    '수확 시 과실에 상처가 나지 않도록 장갑 착용',
                    '낙과 주의: 태풍, 강풍 예보 시 조기 수확 검토',
                    '수확 직후 비 맞히면 저장 중 부패 촉진'
                ]
            },
            {
                id: 'a3',
                title: '수확 후 관리',
                period: '11월',
                icon: 'Warehouse',
                urgency: '보통',
                methods: [
                    'CA 저장고(저온·저산소) 저장 시 선별 후 입고',
                    '토양 분석 샘플 채취 (내년 시비 계획용)',
                    '낙엽 수거 및 과원 청소 (월동 병해충 밀도 감소)',
                    '동해 방지를 위한 수간부 백색 도포(석회 페인트)'
                ],
                cautions: [
                    '저장고 온도: 0~1℃, 습도: 90~95% 유지',
                    '에틸렌 발생 과실과 분리 보관 필요',
                    '노후 나무는 개식(새 나무 심기) 계획 수립'
                ]
            }
        ]
    }
];

/** 현재 월을 기준으로 계절을 반환 */
export function getCurrentSeason(): SeasonId {
    const month = new Date().getMonth() + 1; // 1~12
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}

/** 특정 계절의 데이터를 반환 */
export function getSeasonData(seasonId: SeasonId): SeasonData {
    return seasons.find(s => s.id === seasonId)!;
}
