import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
    },
};

const WebStorageAdapter = {
    getItem: (key: string) => {
        try {
            return Promise.resolve(window.localStorage.getItem(key));
        } catch (e) {
            return Promise.resolve(null);
        }
    },
    setItem: (key: string, value: string) => {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) { }
        return Promise.resolve();
    },
    removeItem: (key: string) => {
        try {
            window.localStorage.removeItem(key);
        } catch (e) { }
        return Promise.resolve();
    },
};

const storageAdapter = Platform.OS === 'web' ? WebStorageAdapter : ExpoSecureStoreAdapter;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Native 지원을 위한 Storage 아답터 적용
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: storageAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
