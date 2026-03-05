'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, PriceItem, IncomingRecord, SalesRecord, BoxType } from '@/types/inventory';

// 앱 최초 로딩 시 prices 테이블이 비어 있으면 삽입할 기본 단가 데이터
const INITIAL_PRICES: Omit<PriceItem, 'id'>[] = [
    { category: '10kg', itemName: '20과', price: 100000 },
    { category: '10kg', itemName: '22과', price: 90000 },
    { category: '10kg', itemName: '26과', price: 80000 },
    { category: '10kg', itemName: '30과', price: 70000 },
    { category: '10kg', itemName: '40과', price: 60000 },
    { category: '10kg', itemName: '42과', price: 55000 },
    { category: '10kg', itemName: '46과', price: 50000 },
    { category: '10kg', itemName: '50과', price: 45000 },
    { category: '5kg', itemName: '10과', price: 55000 },
    { category: '5kg', itemName: '11과', price: 50000 },
    { category: '5kg', itemName: '13과', price: 45000 },
    { category: '5kg', itemName: '15과', price: 40000 },
    { category: '5kg', itemName: '17과', price: 35000 },
    { category: '사과즙', itemName: '1박스', price: 25000 },
    { category: '사과즙', itemName: '2박스', price: 48000 },
    { category: '사과즙', itemName: '3박스', price: 70000 },
];

// Supabase 행(Row)을 앱 타입으로 매핑하는 헬퍼 함수들
function mapPriceRow(row: any): PriceItem {
    return { id: row.id, category: row.category, itemName: row.item_name, price: row.price };
}
function mapIncomingRow(row: any): IncomingRecord {
    return {
        id: row.id,
        date: row.date,
        type: row.type,
        boxType: row.box_type as BoxType | undefined,
        category: row.category as Category | undefined,
        itemName: row.item_name || undefined,
        quantity: row.quantity,
        unitPrice: row.unit_price || undefined,
        totalPrice: row.total_price || undefined,
    };
}
function mapSalesRow(row: any): SalesRecord {
    return {
        id: row.id,
        date: row.date,
        category: row.category,
        itemName: row.item_name,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalPrice: row.total_price,
    };
}

export function useInventory() {
    const [prices, setPrices] = useState<PriceItem[]>([]);
    const [incoming, setIncoming] = useState<IncomingRecord[]>([]);
    const [sales, setSales] = useState<SalesRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ─── 초기 데이터 로드 ───
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                // 1) 단가 로드
                const { data: priceRows, error: priceError } = await supabase
                    .from('prices')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (priceError) throw priceError;

                if (!priceRows || priceRows.length === 0) {
                    // 테이블이 비어 있으면 초기 데이터 삽입
                    const insertRows = INITIAL_PRICES.map(p => ({
                        category: p.category,
                        item_name: p.itemName,
                        price: p.price,
                    }));
                    const { data: inserted, error: insertErr } = await supabase
                        .from('prices')
                        .insert(insertRows)
                        .select();
                    if (insertErr) throw insertErr;
                    setPrices((inserted || []).map(mapPriceRow));
                } else {
                    setPrices(priceRows.map(mapPriceRow));
                }

                // 2) 입고 기록 로드
                const { data: incomingRows, error: incomingError } = await supabase
                    .from('incoming_records')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (incomingError) throw incomingError;
                setIncoming((incomingRows || []).map(mapIncomingRow));

                // 3) 판매 기록 로드
                const { data: salesRows, error: salesError } = await supabase
                    .from('sales_records')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (salesError) throw salesError;
                setSales((salesRows || []).map(mapSalesRow));
            } catch (err) {
                console.error('Supabase 데이터 로딩 오류:', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // ─── 단가 수정 ───
    const updatePrice = useCallback(async (id: string, newPrice: number) => {
        // 낙관적 업데이트: 화면을 먼저 바꾸고 DB에 반영
        setPrices(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
        const { error } = await supabase
            .from('prices')
            .update({ price: newPrice })
            .eq('id', id);
        if (error) {
            console.error('단가 수정 오류:', error);
        }
    }, []);

    // ─── 단가 조회 ───
    const getPrice = useCallback((category: Category, itemName: string): number => {
        const item = prices.find(p => p.category === category && p.itemName === itemName);
        return item ? item.price : 0;
    }, [prices]);

    // ─── 입고 기록 추가 ───
    const addIncoming = useCallback(async (record: Omit<IncomingRecord, 'id'>) => {
        const row = {
            date: record.date,
            type: record.type,
            box_type: record.boxType || null,
            category: record.category || null,
            item_name: record.itemName || null,
            quantity: record.quantity,
            unit_price: record.unitPrice || null,
            total_price: record.totalPrice || null,
        };

        const { data, error } = await supabase
            .from('incoming_records')
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('입고 기록 저장 오류:', error);
            throw new Error(error.message || '입고 기록 저장 중 알 수 없는 오류가 발생했습니다.');
        }
        if (data) {
            setIncoming(prev => [mapIncomingRow(data), ...prev]);
        }
    }, []);

    // ─── 판매 기록 추가 ───
    const addSales = useCallback(async (record: Omit<SalesRecord, 'id'>) => {
        const row = {
            date: record.date,
            category: record.category,
            item_name: record.itemName,
            quantity: record.quantity,
            unit_price: record.unitPrice,
            total_price: record.totalPrice,
        };

        const { data, error } = await supabase
            .from('sales_records')
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('판매 기록 저장 오류:', error);
            throw new Error(error.message || '판매 기록 저장 중 알 수 없는 오류가 발생했습니다.');
        }
        if (data) {
            setSales(prev => [mapSalesRow(data), ...prev]);
        }
    }, []);

    return {
        prices,
        incoming,
        sales,
        isLoading,
        updatePrice,
        getPrice,
        addIncoming,
        addSales,
    };
}
