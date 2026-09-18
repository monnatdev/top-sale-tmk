CREATE TYPE "public"."audit_action" AS ENUM('created', 'edited', 'submitted', 'approved', 'returned', 'exported', 'closed');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('credit', 'cash');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent', 'won', 'returned');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('sale', 'executive');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"address_line" text DEFAULT '' NOT NULL,
	"sub_district" text DEFAULT '' NOT NULL,
	"district" text DEFAULT '' NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"phone" text,
	"tax_id" text,
	"payment_type" "payment_type" DEFAULT 'credit' NOT NULL,
	"credit_days" integer DEFAULT 30 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"packaging_spec" text DEFAULT '' NOT NULL,
	"weight_per_bag" numeric(6, 2) NOT NULL,
	"image_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'sale' NOT NULL,
	"signature_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"packaging_spec" text DEFAULT '' NOT NULL,
	"weight_per_bag" numeric(6, 2) NOT NULL,
	"image_path" text,
	"price_per_bag" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotation_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quotation_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotation_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"status" "quotation_status" DEFAULT 'draft' NOT NULL,
	"quote_date" date NOT NULL,
	"valid_until" date,
	"customer_name" text NOT NULL,
	"customer_address_line" text DEFAULT '' NOT NULL,
	"customer_sub_district" text DEFAULT '' NOT NULL,
	"customer_district" text DEFAULT '' NOT NULL,
	"customer_province" text DEFAULT '' NOT NULL,
	"customer_postal_code" text DEFAULT '' NOT NULL,
	"customer_phone" text,
	"customer_tax_id" text,
	"payment_type" "payment_type" DEFAULT 'credit' NOT NULL,
	"credit_days" integer DEFAULT 30 NOT NULL,
	"signed_by" uuid,
	"signed_at" timestamp with time zone,
	"signature_path" text,
	"return_reason" text,
	"sent_at" timestamp with time zone,
	"won_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quote_number_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"last_no" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_number_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_notes" ADD CONSTRAINT "quotation_notes_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_signed_by_profiles_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_quotation_id_idx" ON "audit_log" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customers_created_by_idx" ON "customers" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "customers_company_name_idx" ON "customers" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "products_is_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotation_notes_quotation_id_idx" ON "quotation_notes" USING btree ("quotation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_quote_number_uidx" ON "quotations" USING btree ("quote_number");--> statement-breakpoint
CREATE INDEX "quotations_owner_id_idx" ON "quotations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "quotations_status_idx" ON "quotations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotations_customer_id_idx" ON "quotations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "quotations_created_at_idx" ON "quotations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "quotations_owner_status_created_idx" ON "quotations" USING btree ("owner_id","status","created_at");