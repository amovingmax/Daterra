export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          district: string
          id: string
          is_primary: boolean
          label: string
          latitude: number | null
          longitude: number | null
          number: string
          reference: string | null
          state: string
          street: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          district: string
          id?: string
          is_primary?: boolean
          label: string
          latitude?: number | null
          longitude?: number | null
          number: string
          reference?: string | null
          state: string
          street: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          district?: string
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          number?: string
          reference?: string | null
          state?: string
          street?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          icon: string | null
          is_active: boolean
          label: string
          parent_slug: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string | null
          is_active?: boolean
          label: string
          parent_slug?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string | null
          is_active?: boolean
          label?: string
          parent_slug?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_slug_fkey"
            columns: ["parent_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_kind: string
          discount_value: number
          ends_at: string
          id: string
          min_order_cents: number | null
          starts_at: string
          supplier_id: string | null
          usage_limit: number | null
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_kind: string
          discount_value: number
          ends_at: string
          id?: string
          min_order_cents?: number | null
          starts_at?: string
          supplier_id?: string | null
          usage_limit?: number | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_kind?: string
          discount_value?: number
          ends_at?: string
          id?: string
          min_order_cents?: number | null
          starts_at?: string
          supplier_id?: string | null
          usage_limit?: number | null
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "coupons_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      expo_push_tokens: {
        Row: {
          created_at: string
          device: string | null
          last_used_at: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          last_used_at?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          last_used_at?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expo_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string | null
          supplier_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id?: string | null
          supplier_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string | null
          supplier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "favorites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons: Json
          id: string
          name_snapshot: string
          note: string | null
          order_id: string
          product_id: string | null
          quantity: number
          unit_price_cents: number
          variation_label: string | null
        }
        Insert: {
          addons?: Json
          id?: string
          name_snapshot: string
          note?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          unit_price_cents: number
          variation_label?: string | null
        }
        Update: {
          addons?: Json
          id?: string
          name_snapshot?: string
          note?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price_cents?: number
          variation_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancellation_detail: string | null
          cancellation_reason:
            | Database["public"]["Enums"]["cancel_reason"]
            | null
          cancelled_at: string | null
          cancelled_by: string | null
          commission_cents: number
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: Json | null
          delivery_cents: number
          delivery_eta_minutes: number | null
          delivery_provider:
            | Database["public"]["Enums"]["delivery_provider"]
            | null
          delivery_tracking_url: string | null
          discount_cents: number
          id: string
          number: string
          out_for_delivery_at: string | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          supplier_id: string
          total_cents: number
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          cancellation_detail?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["cancel_reason"]
            | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_cents: number
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_cents?: number
          delivery_eta_minutes?: number | null
          delivery_provider?:
            | Database["public"]["Enums"]["delivery_provider"]
            | null
          delivery_tracking_url?: string | null
          discount_cents?: number
          id?: string
          number: string
          out_for_delivery_at?: string | null
          payment_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          supplier_id: string
          total_cents: number
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          cancellation_detail?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["cancel_reason"]
            | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_cents?: number
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_cents?: number
          delivery_eta_minutes?: number | null
          delivery_provider?:
            | Database["public"]["Enums"]["delivery_provider"]
            | null
          delivery_tracking_url?: string | null
          discount_cents?: number
          id?: string
          number?: string
          out_for_delivery_at?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          supplier_id?: string
          total_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_cards: {
        Row: {
          brand: string
          created_at: string
          exp_month: number
          exp_year: number
          holder_name: string
          id: string
          is_default: boolean
          last4: string
          mp_card_id: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          exp_month: number
          exp_year: number
          holder_name: string
          id?: string
          is_default?: boolean
          last4: string
          mp_card_id: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          holder_name?: string
          id?: string
          is_default?: boolean
          last4?: string
          mp_card_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_orders: {
        Row: {
          net_amount_cents: number
          order_id: string
          payout_id: string
        }
        Insert: {
          net_amount_cents: number
          order_id: string
          payout_id: string
        }
        Update: {
          net_amount_cents?: number
          order_id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_orders_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          created_at: string
          failure_reason: string | null
          id: string
          paid_at: string | null
          pix_key: string
          scheduled_for: string
          status: Database["public"]["Enums"]["payout_status"]
          supplier_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          pix_key: string
          scheduled_for: string
          status?: Database["public"]["Enums"]["payout_status"]
          supplier_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          pix_key?: string
          scheduled_for?: string
          status?: Database["public"]["Enums"]["payout_status"]
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "payouts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          addons: Json | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          ingredients: string | null
          is_active: boolean
          name: string
          photos: string[]
          price_cents: number
          promo_ends_at: string | null
          promo_price_cents: number | null
          promo_starts_at: string | null
          shelf_life_days: number | null
          sku: string | null
          slug: string
          sort_order: number
          source: string | null
          source_url: string | null
          stock: number | null
          store_section: string | null
          subcategory: string | null
          supplier_id: string
          updated_at: string
          variations: Json | null
          weight_grams: number | null
        }
        Insert: {
          addons?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string | null
          is_active?: boolean
          name: string
          photos?: string[]
          price_cents: number
          promo_ends_at?: string | null
          promo_price_cents?: number | null
          promo_starts_at?: string | null
          shelf_life_days?: number | null
          sku?: string | null
          slug: string
          sort_order?: number
          source?: string | null
          source_url?: string | null
          stock?: number | null
          store_section?: string | null
          subcategory?: string | null
          supplier_id: string
          updated_at?: string
          variations?: Json | null
          weight_grams?: number | null
        }
        Update: {
          addons?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string | null
          is_active?: boolean
          name?: string
          photos?: string[]
          price_cents?: number
          promo_ends_at?: string | null
          promo_price_cents?: number | null
          promo_starts_at?: string | null
          shelf_life_days?: number | null
          sku?: string | null
          slug?: string
          sort_order?: number
          source?: string | null
          source_url?: string | null
          stock?: number | null
          store_section?: string | null
          subcategory?: string | null
          supplier_id?: string
          updated_at?: string
          variations?: Json | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notification_prefs: Json
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          notification_prefs?: Json
          phone: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notification_prefs?: Json
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          photos: string[]
          product_id: string | null
          rating_delivery: number | null
          rating_store: number
          supplier_id: string
          supplier_replied_at: string | null
          supplier_reply: string | null
          tags: string[]
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          photos?: string[]
          product_id?: string | null
          rating_delivery?: number | null
          rating_store: number
          supplier_id: string
          supplier_replied_at?: string | null
          supplier_reply?: string | null
          tags?: string[]
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          photos?: string[]
          product_id?: string | null
          rating_delivery?: number | null
          rating_store?: number
          supplier_id?: string
          supplier_replied_at?: string | null
          supplier_reply?: string | null
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_business_hours: {
        Row: {
          closes_at: string
          id: string
          opens_at: string
          supplier_id: string
          weekday: number
        }
        Insert: {
          closes_at: string
          id?: string
          opens_at: string
          supplier_id: string
          weekday: number
        }
        Update: {
          closes_at?: string
          id?: string
          opens_at?: string
          supplier_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_business_hours_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_business_hours_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_users: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["supplier_role"]
          supplier_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["supplier_role"]
          supplier_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["supplier_role"]
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_ratings"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          accepts_pickup: boolean
          avg_prep_minutes: number
          city: string
          cnpj: string
          complement: string | null
          cover_url: string | null
          created_at: string
          delivery_radius_km: number | null
          description: string | null
          district: string | null
          email: string | null
          feito_potiguar_certified_at: string
          feito_potiguar_valid_until: string | null
          id: string
          instagram: string | null
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          manually_closed_until: string | null
          min_order_cents: number
          name: string
          number: string | null
          pix_key: string | null
          primary_category: string | null
          slug: string
          source: string | null
          source_url: string | null
          state: string
          story: string | null
          street: string | null
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at: string
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_pickup?: boolean
          avg_prep_minutes?: number
          city: string
          cnpj: string
          complement?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_radius_km?: number | null
          description?: string | null
          district?: string | null
          email?: string | null
          feito_potiguar_certified_at: string
          feito_potiguar_valid_until?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          manually_closed_until?: string | null
          min_order_cents?: number
          name: string
          number?: string | null
          pix_key?: string | null
          primary_category?: string | null
          slug: string
          source?: string | null
          source_url?: string | null
          state?: string
          story?: string | null
          street?: string | null
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_pickup?: boolean
          avg_prep_minutes?: number
          city?: string
          cnpj?: string
          complement?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_radius_km?: number | null
          description?: string | null
          district?: string | null
          email?: string | null
          feito_potiguar_certified_at?: string
          feito_potiguar_valid_until?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          manually_closed_until?: string | null
          min_order_cents?: number
          name?: string
          number?: string | null
          pix_key?: string | null
          primary_category?: string | null
          slug?: string
          source?: string | null
          source_url?: string | null
          state?: string
          story?: string | null
          street?: string | null
          type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_primary_category_fkey"
            columns: ["primary_category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      waitlist: {
        Row: {
          city: string
          created_at: string
          email: string
          id: string
          source: string | null
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          email: string
          id?: string
          source?: string | null
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          state?: string
        }
        Relationships: []
      }
    }
    Views: {
      supplier_ratings: {
        Row: {
          avg_delivery: number | null
          avg_store: number | null
          supplier_id: string | null
          total_reviews: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_commission: {
        Args: { subtotal_cents: number }
        Returns: number
      }
      generate_order_number: { Args: never; Returns: string }
      is_platform_admin: { Args: never; Returns: boolean }
      is_supplier_member: { Args: { _supplier_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      cancel_reason:
        | "changed_mind"
        | "wrong_item"
        | "too_long"
        | "price_issue"
        | "address_issue"
        | "supplier_unavailable"
        | "out_of_stock"
        | "other"
      delivery_provider: "uber_direct" | "loggi" | "pickup" | "own"
      order_status:
        | "pending_payment"
        | "received"
        | "accepted"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      payment_method: "pix" | "credit_card"
      payment_status: "pending" | "authorized" | "paid" | "refunded" | "failed"
      payout_status: "scheduled" | "processing" | "paid" | "failed"
      supplier_role: "owner" | "manager" | "staff"
      supplier_type: "producer" | "restaurant" | "hospitality"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cancel_reason: [
        "changed_mind",
        "wrong_item",
        "too_long",
        "price_issue",
        "address_issue",
        "supplier_unavailable",
        "out_of_stock",
        "other",
      ],
      delivery_provider: ["uber_direct", "loggi", "pickup", "own"],
      order_status: [
        "pending_payment",
        "received",
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      payment_method: ["pix", "credit_card"],
      payment_status: ["pending", "authorized", "paid", "refunded", "failed"],
      payout_status: ["scheduled", "processing", "paid", "failed"],
      supplier_role: ["owner", "manager", "staff"],
      supplier_type: ["producer", "restaurant", "hospitality"],
    },
  },
} as const
