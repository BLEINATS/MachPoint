import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Supabase URL and/or Anon Key are missing. Please check your environment variables.");
  throw new Error("Missing Supabase configuration");
}

// Configuração otimizada para Replit baseada na documentação oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    },
  },
  realtime: {
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: function (tries: number) {
      return Math.min(tries * 1000, 30000)
    },
  },
  db: {
    schema: 'public',
  }
})

// Função de retry para operações que falham
export const supabaseWithRetry = async (operation: () => Promise<any>) => {
  const maxRetries = 3
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      return await operation()
    } catch (error: any) {
      console.log(`Tentativa ${retries + 1} falhou:`, error.message)
      if (error.message.includes('Failed to fetch') && retries < maxRetries - 1) {
        retries++
        console.log(`Tentando novamente em ${retries * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
        continue
      }
      throw error
    }
  }
}

// Monitor de visibilidade para reconectar quando a página volta ao foco
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('🔄 Página voltou ao foco, verificando sessão...')
      supabase.auth.getSession()
    }
  })
}
