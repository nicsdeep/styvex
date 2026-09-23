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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      order_status_history: {
        Row: {
          id: string
          order_id: string
          previous_status: string | null
          new_status: string
          changed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          previous_status?: string | null
          new_status: string
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          previous_status?: string | null
          new_status?: string
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: string
          status: string
          amount: number
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: string
          status?: string
          amount: number
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: string
          status?: string
          amount?: number
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          id: string
          order_id: string
          payment_id: string
          amount: number
          reason: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_id: string
          amount: number
          reason?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_id?: string
          amount?: number
          reason?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          carrier: string
          tracking_number: string | null
          tracking_url: string | null
          status: string
          shipped_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          carrier: string
          tracking_number?: string | null
          tracking_url?: string | null
          status?: string
          shipped_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          carrier?: string
          tracking_number?: string | null
          tracking_url?: string | null
          status?: string
          shipped_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          id: string
          order_id: string
          first_name: string
          last_name: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          first_name: string
          last_name: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          postal_code: string
          country: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          first_name?: string
          last_name?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          phone?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          retail_markup_percentage: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          retail_markup_percentage?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          retail_markup_percentage?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          supplier: string
          supplier_variant_id: string | null
          variant_id: string | null
          unit_price: number | null
          discount: number | null
        }
        Insert: {
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          supplier?: string
          supplier_variant_id?: string | null
          variant_id?: string | null
          unit_price?: number | null
          discount?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          supplier?: string
          supplier_variant_id?: string | null
          variant_id?: string | null
          unit_price?: number | null
          discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          fulfillment_error: string | null
          fulfillment_provider: string | null
          fulfillment_status: string
          id: string
          payment_status: string
          shipping_address: Json | null
          shipping_amount: number
          status: string
          stripe_session_id: string | null
          subtotal_amount: number | null
          supplier_order_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
          subtotal: number | null
          tax: number | null
          shipping_cost: number | null
          discount: number | null
          final_total: number | null
          inventory_status: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          fulfillment_error?: string | null
          fulfillment_provider?: string | null
          fulfillment_status?: string
          id?: string
          payment_status?: string
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          stripe_session_id?: string | null
          subtotal_amount?: number | null
          supplier_order_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
          subtotal?: number | null
          tax?: number | null
          shipping_cost?: number | null
          discount?: number | null
          final_total?: number | null
          inventory_status?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          fulfillment_error?: string | null
          fulfillment_provider?: string | null
          fulfillment_status?: string
          id?: string
          payment_status?: string
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          stripe_session_id?: string | null
          subtotal_amount?: number | null
          supplier_order_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          subtotal?: number | null
          tax?: number | null
          shipping_cost?: number | null
          discount?: number | null
          final_total?: number | null
          inventory_status?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          id: string
          inventory_quantity: number
          product_id: string
          size: string | null
          sku: string
          supplier_variant_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          inventory_quantity?: number
          product_id: string
          size?: string | null
          sku: string
          supplier_variant_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          inventory_quantity?: number
          product_id?: string
          size?: string | null
          sku?: string
          supplier_variant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_review_count: number | null
          category_id: string | null
          created_at: string
          description: string | null
          fts: unknown
          id: string
          is_featured: boolean
          name: string
          price: number
          slug: string
          supplier: string
          supplier_cost: number | null
          supplier_product_id: string | null
          updated_at: string
        }
        Insert: {
          base_review_count?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: string
          is_featured?: boolean
          name: string
          price?: number
          slug: string
          supplier?: string
          supplier_cost?: number | null
          supplier_product_id?: string | null
          updated_at?: string
        }
        Update: {
          base_review_count?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: string
          is_featured?: boolean
          name?: string
          price?: number
          slug?: string
          supplier?: string
          supplier_cost?: number | null
          supplier_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          interested_products: Json | null
          is_onboarded: boolean
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          interested_products?: Json | null
          is_onboarded?: boolean
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          interested_products?: Json | null
          is_onboarded?: boolean
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          footer_height: number
          footer_logo: string
          header_height: number
          header_logo: string
          id: number
        }
        Insert: {
          footer_height?: number
          footer_logo?: string
          header_height?: number
          header_logo?: string
          id?: number
        }
        Update: {
          footer_height?: number
          footer_logo?: string
          header_height?: number
          header_logo?: string
          id?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
