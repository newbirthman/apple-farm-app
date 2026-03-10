const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(l => {
    if (l.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) url = l.split('=')[1].trim().replace(/['"]/g, '');
    if (l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) key = l.split('=')[1].trim().replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);
supabase.from('memos').select('*').limit(3).then(res => {
    console.log('Error:', res.error);
    console.log('Data:', res.data);
});
