
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfmocsvvqqpcrglfqlwo.supabase.co';
const supabaseAnonKey = 'sb_publishable_8CD1jhUsKRYLRxbDhyNTAQ_KT39GjyS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
