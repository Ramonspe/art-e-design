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
          cep: string
          city: string
          complement: string | null
          created_at: string
          district: string
          id: string
          is_default: boolean
          label: string | null
          number: string
          state: string
          street: string
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          created_at?: string
          district: string
          id?: string
          is_default?: boolean
          label?: string | null
          number: string
          state: string
          street: string
          user_id: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          created_at?: string
          district?: string
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string
          state?: string
          street?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_href: string | null
          cta_label: string | null
          eyebrow: string | null
          id: string
          image: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          eyebrow?: string | null
          id?: string
          image: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          eyebrow?: string | null
          id?: string
          image?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
          variant: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
          variant?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
          variant?: string | null
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
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_cpf: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          notes: string | null
          order_number: number
          paid_at: string | null
          payment_method: string
          payment_status: string | null
          shipping_cep: string
          shipping_city: string
          shipping_complement: string | null
          shipping_cost: number
          shipping_district: string
          shipping_method: string | null
          shipping_number: string
          shipping_state: string
          shipping_street: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          superfrete_delivery_max: number | null
          superfrete_delivery_min: number | null
          superfrete_label_url: string | null
          superfrete_order_id: string | null
          superfrete_service_id: number | null
          superfrete_status: string | null
          superfrete_tracking_code: string | null
          superfrete_volume: Json | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment_method: string
          payment_status?: string | null
          shipping_cep: string
          shipping_city: string
          shipping_complement?: string | null
          shipping_cost?: number
          shipping_district: string
          shipping_method?: string | null
          shipping_number: string
          shipping_state: string
          shipping_street: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          superfrete_delivery_max?: number | null
          superfrete_delivery_min?: number | null
          superfrete_label_url?: string | null
          superfrete_order_id?: string | null
          superfrete_service_id?: number | null
          superfrete_status?: string | null
          superfrete_tracking_code?: string | null
          superfrete_volume?: Json | null
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment_method?: string
          payment_status?: string | null
          shipping_cep?: string
          shipping_city?: string
          shipping_complement?: string | null
          shipping_cost?: number
          shipping_district?: string
          shipping_method?: string | null
          shipping_number?: string
          shipping_state?: string
          shipping_street?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          superfrete_delivery_max?: number | null
          superfrete_delivery_min?: number | null
          superfrete_label_url?: string | null
          superfrete_order_id?: string | null
          superfrete_service_id?: number | null
          superfrete_status?: string | null
          superfrete_tracking_code?: string | null
          superfrete_volume?: Json | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          label: string
          options: string[]
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          label: string
          options?: string[]
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          options?: string[]
          product_id?: string
          sort_order?: number
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
          active: boolean
          badge: Database["public"]["Enums"]["product_badge"] | null
          category_id: string | null
          created_at: string
          description: string
          featured: boolean
          gallery: string[] | null
          id: string
          image: string
          is_template: boolean
          name: string
          old_price: number | null
          price: number
          shipping_height_cm: number | null
          shipping_length_cm: number | null
          shipping_weight_kg: number | null
          shipping_width_cm: number | null
          slug: string
          stock: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          badge?: Database["public"]["Enums"]["product_badge"] | null
          category_id?: string | null
          created_at?: string
          description: string
          featured?: boolean
          gallery?: string[] | null
          id?: string
          image: string
          is_template?: boolean
          name: string
          old_price?: number | null
          price: number
          shipping_height_cm?: number | null
          shipping_length_cm?: number | null
          shipping_weight_kg?: number | null
          shipping_width_cm?: number | null
          slug: string
          stock?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          badge?: Database["public"]["Enums"]["product_badge"] | null
          category_id?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          gallery?: string[] | null
          id?: string
          image?: string
          is_template?: boolean
          name?: string
          old_price?: number | null
          price?: number
          shipping_height_cm?: number | null
          shipping_length_cm?: number | null
          shipping_weight_kg?: number | null
          shipping_width_cm?: number | null
          slug?: string
          stock?: number | null
          updated_at?: string
          video_url?: string | null
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
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          active: boolean
          cep_end: string
          cep_start: string
          created_at: string
          delivery_days_max: number
          delivery_days_min: number
          id: string
          price: number
          region_name: string
        }
        Insert: {
          active?: boolean
          cep_end: string
          cep_start: string
          created_at?: string
          delivery_days_max?: number
          delivery_days_min?: number
          id?: string
          price: number
          region_name: string
        }
        Update: {
          active?: boolean
          cep_end?: string
          cep_start?: string
          created_at?: string
          delivery_days_max?: number
          delivery_days_min?: number
          id?: string
          price?: number
          region_name?: string
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
      app_role: "admin" | "customer"
      order_status:
        | "pendente"
        | "confirmado"
        | "em_producao"
        | "enviado"
        | "entregue"
        | "cancelado"
      product_badge: "novo" | "mais-vendido" | "promo"
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
      app_role: ["admin", "customer"],
      order_status: [
        "pendente",
        "confirmado",
        "em_producao",
        "enviado",
        "entregue",
        "cancelado",
      ],
      product_badge: ["novo", "mais-vendido", "promo"],
    },
  },
} as const
