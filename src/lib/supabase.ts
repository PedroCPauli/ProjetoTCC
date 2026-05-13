import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tzyadkdedspbvyoszspu.supabase.co"
const supabaseAnonKey = "sb_publishable_KoISnad9hXGmEu2NNFOpbQ_5JmhHis9"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)