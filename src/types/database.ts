export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          phone: string | null
          gender: string | null
          age_group: string | null
          area: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          phone?: string | null
          gender?: string | null
          age_group?: string | null
          area?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          phone?: string | null
          gender?: string | null
          age_group?: string | null
          area?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parks: {
        Row: {
          id: string
          name: string
          address: string | null
          area: string | null
          prefecture: string | null
          nearest_station: string | null
          has_shower: boolean
          has_parking: boolean
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          area?: string | null
          prefecture?: string | null
          nearest_station?: string | null
          has_shower?: boolean
          has_parking?: boolean
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          area?: string | null
          prefecture?: string | null
          nearest_station?: string | null
          has_shower?: boolean
          has_parking?: boolean
          image_url?: string | null
          created_at?: string
        }
      }
      event_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sort_order?: number
        }
      }
      events: {
        Row: {
          id: string
          park_id: string
          category_id: string
          title: string
          description: string | null
          date: string
          start_time: string
          end_time: string
          price: number
          capacity: number
          current_count: number
          status: string
          level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          park_id: string
          category_id: string
          title: string
          description?: string | null
          date: string
          start_time: string
          end_time: string
          price: number
          capacity: number
          current_count?: number
          status?: string
          level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          park_id?: string
          category_id?: string
          title?: string
          description?: string | null
          date?: string
          start_time?: string
          end_time?: string
          price?: number
          capacity?: number
          current_count?: number
          status?: string
          level?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: string
          created_at: string
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status?: string
          created_at?: string
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: string
          created_at?: string
          cancelled_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          stripe_payment_id: string | null
          amount: number
          status: string
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          stripe_payment_id?: string | null
          amount: number
          status?: string
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          stripe_payment_id?: string | null
          amount?: number
          status?: string
          paid_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Park = Database['public']['Tables']['parks']['Row']
export type EventCategory = Database['public']['Tables']['event_categories']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// Extended types with relations
export type EventWithRelations = Event & {
  park: Park
  category: EventCategory
}

export type BookingWithRelations = Booking & {
  event: EventWithRelations
  payment?: Payment
}
