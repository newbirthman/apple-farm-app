export type Category = '10kg' | '5kg' | '사과즙';

export interface PriceItem {
    id: string;
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
    category?: Category; // 판매대기일 경우에만
    itemName?: string; // 판매대기일 경우에만
    quantity: number;
    unitPrice?: number; // 큰상자는 없음
    totalPrice?: number; // 큰상자는 없음
}

export interface SalesRecord {
    id: string;
    date: string; // YYYY-MM-DD
    category: Category;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

// 재고 요약(대시보드 노출)을 위한 타입
export interface InventorySummary {
    category: Category;
    itemName: string;
    totalIncoming: number;
    totalSales: number;
    currentStock: number;
    stockValue: number; // currentStock * unitPrice
}
