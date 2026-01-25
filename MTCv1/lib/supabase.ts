import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  email: string
  name: string
  phone?: string
  skill_level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro'
  created_at: string
}

export interface Court {
  id: string
  name: string
  surface_type: string
  has_lights: boolean
  is_active: boolean
  hourly_rate: number
}

export interface Booking {
  id: string
  court_id: string
  user_id: string
  booking_date: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_amount: number
  created_at: string
  courts?: Court
  profiles?: Profile
}

export interface PartnerRequest {
  id: string
  user_id: string
  requested_date: string
  requested_time: string
  skill_level_sought: string
  message?: string
  status: 'open' | 'matched' | 'expired'
  created_at: string
  profiles?: Profile
}
