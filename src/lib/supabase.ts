// lib/supabase.ts — 浏览器端 Supabase Client
// 用于: 画廊公开数据读取, Supabase Auth 登录
// 注意: 使用 lazy init，避免 build/prerender 时因缺少环境变量而崩溃

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "[Supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

// 兼容导出: 在运行时才实际实例化
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});
