export type Category = '10kg' | '5kg' | '사과즙' | string;

export interface PriceItem {
    id: string;
    cropType: string; // 새로 추가된 품목 분류 (예: 사과, 배, 복숭아 등)
    category: Category;
    itemName: string;
    price: number;
}

export type IncomingType = '큰상자' | '판매대기';
export type BoxType = '택배' | '수령';

export interface IncomingRecord {
    id: string;
    date: string; // YYYY-MM-DD
    type: IncomingType;
    boxType?: BoxType; // 판매대기일 경우에만
    cropType?: string; // 판매대기일 경우에만
    category?: Category; // 판매대기일 경우에만
    itemName?: string; // 판매대기일 경우에만
    packagingStatus?: '도소매포장' | '택배포장' | '미포장'; // 신규 항목
    quantity: number;
    unitPrice?: number; // 큰상자는 없음
    totalPrice?: number; // 큰상자는 없음
}

export interface SalesRecord {
    id: string;
    date: string; // YYYY-MM-DD
    cropType: string;
    packagingStatus?: '도소매포장' | '택배포장' | '미포장'; // 신규 항목
    category: Category;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

// 재고 요약(대시보드 노출)을 위한 타입
export interface InventorySummary {
    cropType: string;
    packagingStatus?: '도소매포장' | '택배포장' | '미포장'; // 표 구분을 위해 추가
    category: Category;
    itemName: string;
    totalIncoming: number;
    totalSales: number;
    currentStock: number;
    stockValue: number; // currentStock * unitPrice
}

// 신규 고객 타입
export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    created_at?: string;
}
