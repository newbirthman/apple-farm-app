'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, PriceItem, IncomingRecord, SalesRecord, BoxType, Customer } from '@/types/inventory';

// 앱 최초 로딩 시 prices 테이블이 비어 있으면 삽입할 기본 단가 데이터
const INITIAL_PRICES: Omit<PriceItem, 'id'>[] = [
    { cropType: '사과', category: '10kg', itemName: '20과', price: 100000 },
    { cropType: '사과', category: '10kg', itemName: '22과', price: 90000 },
    { cropType: '사과', category: '10kg', itemName: '26과', price: 80000 },
    { cropType: '사과', category: '10kg', itemName: '30과', price: 70000 },
    { cropType: '사과', category: '10kg', itemName: '40과', price: 60000 },
    { cropType: '사과', category: '10kg', itemName: '42과', price: 55000 },
    { cropType: '사과', category: '10kg', itemName: '46과', price: 50000 },
    { cropType: '사과', category: '10kg', itemName: '50과', price: 45000 },
    { cropType: '사과', category: '5kg', itemName: '10과', price: 55000 },
    { cropType: '사과', category: '5kg', itemName: '11과', price: 50000 },
    { cropType: '사과', category: '5kg', itemName: '13과', price: 45000 },
    { cropType: '사과', category: '5kg', itemName: '15과', price: 40000 },
    { cropType: '사과', category: '5kg', itemName: '17과', price: 35000 },
    { cropType: '사과', category: '사과즙', itemName: '1박스', price: 25000 },
    { cropType: '사과', category: '사과즙', itemName: '2박스', price: 48000 },
    { cropType: '사과', category: '사과즙', itemName: '3박스', price: 70000 },
];

// Supabase 행(Row)을 앱 타입으로 매핑하는 헬퍼 함수들
function mapPriceRow(row: any): PriceItem {
    return { id: row.id, cropType: row.crop_type || '사과', category: row.category, itemName: row.item_name, price: row.price };
}
function mapIncomingRow(row: any): IncomingRecord {
    return {
        id: row.id,
        date: row.date,
        type: row.type,
        boxType: row.box_type as BoxType | undefined,
        cropType: row.crop_type || '사과',
        category: row.category as Category | undefined,
        itemName: row.item_name || undefined,
        packagingStatus: row.packaging_status || undefined, // 포장상태 파싱
        quantity: row.quantity,
        unitPrice: row.unit_price || undefined,
        totalPrice: row.total_price || undefined,
    };
}
function mapSalesRow(row: any): SalesRecord {
    return {
        id: row.id,
        date: row.date,
        cropType: row.crop_type || '사과',
        packagingStatus: row.packaging_status || undefined, // 포장상태 파싱
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
    const [deliveryFee, setDeliveryFee] = useState<number>(0);
    const [customers, setCustomers] = useState<Customer[]>([]);
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
                        crop_type: p.cropType,
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

                // 4) 앱 글로벌 설정 로드 (택배비)
                const { data: settingsData } = await supabase
                    .from('app_settings')
                    .select('*')
                    .eq('key', 'delivery_fee')
                    .single();

                if (settingsData && settingsData.value) {
                    setDeliveryFee(parseInt(settingsData.value, 10) || 0);
                }

                // 5) 고객 명단 로드
                const { data: customerData } = await supabase
                    .from('customers')
                    .select('*')
                    .order('name', { ascending: true });
                if (customerData) {
                    setCustomers(customerData);
                }

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
            crop_type: record.cropType || '사과',
            category: record.category || null,
            item_name: record.itemName || null,
            packaging_status: record.packagingStatus || null, // 포장상태 저장
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
            crop_type: record.cropType || '사과',
            packaging_status: record.packagingStatus || null, // 포장상태 저장
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

    // ─── 새 상품(단가) 등록 ───
    const addPriceItem = useCallback(async (record: { cropType: string, category: string, itemName: string, price: number }) => {
        const row = {
            crop_type: record.cropType,
            category: record.category,
            item_name: record.itemName,
            price: record.price,
        };

        const { data, error } = await supabase
            .from('prices')
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('상품 등록 오류:', error);
            throw new Error(error.message || '상품 등록 중 알 수 없는 오류가 발생했습니다.');
        }
        if (data) {
            setPrices(prev => [...prev, mapPriceRow(data)]);
        }
    }, []);

    // ─── 단가표(상품) 레코드 삭제 ───
    const deletePriceItem = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('prices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('단가표 삭제 오류:', error);
            throw new Error(error.message || '단가표 삭제 중 알 수 없는 오류가 발생했습니다.');
        }

        // 상태 업데이트
        setPrices(prev => prev.filter(p => p.id !== id));
    }, []);

    // ─── 고객 추가 / 수정 (Upsert) ───
    const upsertCustomer = useCallback(async (record: { id?: string, name: string, phone: string, address: string }) => {
        const row = record.id ? { id: record.id, ...record } : record;
        const { data, error } = await supabase
            .from('customers')
            .upsert(row)
            .select()
            .single();

        if (error) {
            console.error('고객 저장 오류:', error);
            throw new Error(error.message || '고객 저장 중 오류가 발생했습니다.');
        }

        if (data) {
            setCustomers(prev => {
                const existingIndex = prev.findIndex(c => c.id === data.id);
                if (existingIndex >= 0) {
                    const newArr = [...prev];
                    newArr[existingIndex] = data;
                    return newArr.sort((a, b) => a.name.localeCompare(b.name));
                }
                return [...prev, data].sort((a, b) => a.name.localeCompare(b.name));
            });
        }
    }, []);

    // ─── 고객 삭제 ───
    const deleteCustomer = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('고객 삭제 오류:', error);
            throw new Error(error.message);
        }
        setCustomers(prev => prev.filter(c => c.id !== id));
    }, []);

    // ─── 택배비 업데이트 ───
    const updateDeliveryFee = useCallback(async (fee: number) => {
        setDeliveryFee(fee); // 낙관적
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'delivery_fee', value: fee.toString() });
        if (error) console.error('택배비 수정 오류:', error);
    }, []);

    return {
        prices,
        incoming,
        sales,
        deliveryFee,
        customers,
        isLoading,
        updatePrice,
        getPrice,
        addIncoming,
        addSales,
        addPriceItem,
        deletePriceItem,
        upsertCustomer,
        deleteCustomer,
        updateDeliveryFee,
    };
}
