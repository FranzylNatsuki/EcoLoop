


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."pledge_status" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."pledge_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'registered',
    'admin',
    'moderator'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profile_data (id)
  values (new.id);

  insert into public.profiles (
    id, email, full_name, location, contact_number, is_org,
    latitude, longitude, address, profile_data_fk
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Unknown User'),
    new.raw_user_meta_data ->> 'location',
    new.raw_user_meta_data ->> 'contact_number',
    coalesce((new.raw_user_meta_data ->> 'is_org')::boolean, false),
    (new.raw_user_meta_data ->> 'latitude')::double precision,
    (new.raw_user_meta_data ->> 'longitude')::double precision,
    new.raw_user_meta_data ->> 'address',
    new.id
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profile_data (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_pledge_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  total_items integer;
begin
  -- Only trigger when a pledge transitions to 'completed'
  if new.status = 'completed' and old.status <> 'completed' then

    -- Sum the item quantities in this specific pledge
    select coalesce(sum(quantity), 0) into total_items from public.pledge_items where pledge_id = new.id;

    -- Update the donor's profile stats securely (using COALESCE to prevent NULL math errors)
    update public.profile_data
    set "ItemsDonated" = coalesce("ItemsDonated", 0) + total_items,
        "ProjectsSupported" = coalesce("ProjectsSupported", 0) + 1
    where id = new.donor_id;

  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_pledge_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_post_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if (tg_op = 'INSERT') then
    update public.cause_requests set vote_count = vote_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.cause_requests set vote_count = vote_count - 1 where id = old.post_id;
    return old;
  end if;
end;
$$;


ALTER FUNCTION "public"."handle_post_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_self_pledge"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  target_author_id uuid;
begin
  -- Look up the author of the post being pledged to
  select author_id into target_author_id
  from public.cause_requests
  where id = new.post_id;

  -- Block the insert if they match
  if new.donor_id = target_author_id then
    raise exception 'Security Violation: Users cannot pledge to their own posts.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_self_pledge"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_posts_on_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If they change their name or location, trigger a silent update on their posts to rebuild the index
  IF NEW.full_name IS DISTINCT FROM OLD.full_name OR NEW.location IS DISTINCT FROM OLD.location THEN
    UPDATE public.cause_requests SET id = id WHERE author_id = NEW.id;
    UPDATE public.events SET id = id WHERE author_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_posts_on_profile_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cause_requests_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_name text;
  user_location text;
BEGIN
  -- Pull 'location' from the profiles table
  SELECT full_name, location INTO user_name, user_location
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Index the post using NEW.location_address
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(user_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location_address, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(user_location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.body, '')), 'C');

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_cause_requests_fts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (TG_OP = 'INSERT') then
    update public.cause_requests
    set comment_count = coalesce(comment_count, 0) + 1
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.cause_requests
    set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."update_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_score"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_avg double precision;
begin
  select coalesce(avg(score), 0) into new_avg from public.user_ratings where ratee_id = coalesce(new.ratee_id, old.ratee_id);
  update public.profile_data set "CommunityScore" = round(new_avg::numeric, 1) where id = coalesce(new.ratee_id, old.ratee_id);
  return null;
end;
$$;


ALTER FUNCTION "public"."update_community_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_events_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_name text;
  user_location text;
BEGIN
  -- Pull 'location' from the profiles table
  SELECT full_name, location INTO user_name, user_location
  FROM public.profiles
  WHERE id = NEW.author_id;

  -- Index the event using NEW.location
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(user_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(user_location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'D');

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_events_fts"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cause_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "category" "text" NOT NULL,
    "vote_count" integer DEFAULT 0 NOT NULL,
    "comment_count" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" double precision,
    "longitude" double precision,
    "location_address" "text",
    "is_completed" boolean DEFAULT false NOT NULL,
    "fts" "tsvector"
);


ALTER TABLE "public"."cause_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_pledge_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_pledge_id" "uuid" NOT NULL,
    "material_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit" "text" DEFAULT 'units'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "event_pledge_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."event_pledge_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_pledges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "donor_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "pickup_preference" "text" DEFAULT 'deliver'::"text" NOT NULL,
    "location_address" "text",
    "latitude" double precision,
    "longitude" double precision,
    "status" "public"."pledge_status" DEFAULT 'pending'::"public"."pledge_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_pledges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "location" "text" NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "banner_url" "text",
    "materials_needed" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" double precision,
    "longitude" double precision,
    "fts" "tsvector"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_listing_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "marketplace_listing_images_display_order_check" CHECK (("display_order" >= 0))
);


ALTER TABLE "public"."marketplace_listing_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "post_type" "text" DEFAULT 'marketplace'::"text" NOT NULL,
    "pricing_type" "text" DEFAULT 'For Sale'::"text" NOT NULL,
    "pricing_structure" "text" DEFAULT 'Per Unit / kg'::"text" NOT NULL,
    "price" numeric(12,2),
    "quantity" numeric(12,3),
    "quantity_unit" "text" DEFAULT 'pcs'::"text" NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_address" "text",
    "latitude" double precision,
    "longitude" double precision,
    CONSTRAINT "check_marketplace_listing_status" CHECK (("status" = ANY (ARRAY['available'::"text", 'pending'::"text", 'sold'::"text"]))),
    CONSTRAINT "marketplace_free_listing_no_price" CHECK ((("pricing_type" <> 'Free/Donation'::"text") OR ("price" IS NULL))),
    CONSTRAINT "marketplace_listings_category_check" CHECK (("category" = ANY (ARRAY['Plastics'::"text", 'Glass'::"text", 'Paper/Cardboard'::"text", 'Metal'::"text", 'Electronics'::"text"]))),
    CONSTRAINT "marketplace_listings_description_check" CHECK ((("char_length"("btrim"("description")) >= 1) AND ("char_length"("btrim"("description")) <= 5000))),
    CONSTRAINT "marketplace_listings_post_type_check" CHECK (("post_type" = 'marketplace'::"text")),
    CONSTRAINT "marketplace_listings_price_check" CHECK ((("price" IS NULL) OR ("price" >= (0)::numeric))),
    CONSTRAINT "marketplace_listings_pricing_structure_check" CHECK (("pricing_structure" = ANY (ARRAY['Per Unit / kg'::"text", 'Bulk Bundle (e.g., per 20 pcs)'::"text", 'Total Lot Price (Price for All)'::"text"]))),
    CONSTRAINT "marketplace_listings_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['For Sale'::"text", 'Free/Donation'::"text"]))),
    CONSTRAINT "marketplace_listings_quantity_check" CHECK ((("quantity" IS NULL) OR ("quantity" >= (0)::numeric))),
    CONSTRAINT "marketplace_listings_quantity_unit_check" CHECK (("quantity_unit" = ANY (ARRAY['pcs'::"text", 'kg'::"text", 'items'::"text", 'lots'::"text"]))),
    CONSTRAINT "marketplace_listings_title_check" CHECK ((("char_length"("btrim"("title")) >= 1) AND ("char_length"("btrim"("title")) <= 200))),
    CONSTRAINT "marketplace_sale_listing_has_price" CHECK ((("pricing_type" <> 'For Sale'::"text") OR ("price" IS NOT NULL)))
);


ALTER TABLE "public"."marketplace_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "verification_status" "public"."verification_status" DEFAULT 'pending'::"public"."verification_status" NOT NULL,
    "verification_documents" "text"[],
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pledge_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pledge_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pledge_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pledge_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pledge_id" "uuid" NOT NULL,
    "material_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit" "text" DEFAULT 'units'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pledge_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."pledge_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pledges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "donor_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "pickup_preference" "text" DEFAULT 'deliver'::"text" NOT NULL,
    "location_address" "text",
    "status" "public"."pledge_status" DEFAULT 'pending'::"public"."pledge_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" double precision,
    "longitude" double precision
);


ALTER TABLE "public"."pledges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_data" (
    "id" "uuid" NOT NULL,
    "about" "text",
    "ItemsDonated" bigint DEFAULT 0,
    "ProjectsSupported" bigint DEFAULT 0,
    "MaterialsCollected" bigint DEFAULT 0,
    "CommunityScore" double precision DEFAULT 0.0,
    "Posts" "jsonb" DEFAULT '[]'::"jsonb",
    "DonationHistory" "jsonb" DEFAULT '[]'::"jsonb",
    "SavedPosts" "jsonb" DEFAULT '[]'::"jsonb",
    "Avatar" "text" DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'::"text"
);


ALTER TABLE "public"."profile_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "location" "text",
    "contact_number" "text",
    "email" "text" NOT NULL,
    "is_org" boolean DEFAULT false NOT NULL,
    "organization_id" "uuid",
    "role" "public"."user_role" DEFAULT 'registered'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_data_fk" "uuid",
    "latitude" double precision,
    "longitude" double precision,
    "address" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_purchase_request_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text"]))),
    CONSTRAINT "purchase_requests_check" CHECK (("buyer_id" <> "seller_id")),
    CONSTRAINT "purchase_requests_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."purchase_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rater_id" "uuid" NOT NULL,
    "ratee_id" "uuid" NOT NULL,
    "score" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_ratings_score_check" CHECK ((("score" >= 1) AND ("score" <= 5)))
);


ALTER TABLE "public"."user_ratings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cause_requests"
    ADD CONSTRAINT "cause_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_pledge_items"
    ADD CONSTRAINT "event_pledge_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_pledges"
    ADD CONSTRAINT "event_pledges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_listing_images"
    ADD CONSTRAINT "marketplace_listing_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pledge_images"
    ADD CONSTRAINT "pledge_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pledge_items"
    ADD CONSTRAINT "pledge_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pledges"
    ADD CONSTRAINT "pledges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_images"
    ADD CONSTRAINT "post_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("user_id", "post_id");



ALTER TABLE ONLY "public"."profile_data"
    ADD CONSTRAINT "profile_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ratings"
    ADD CONSTRAINT "user_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ratings"
    ADD CONSTRAINT "user_ratings_rater_id_ratee_id_key" UNIQUE ("rater_id", "ratee_id");



CREATE INDEX "cause_requests_fts_idx" ON "public"."cause_requests" USING "gin" ("fts");



CREATE INDEX "event_pledge_items_event_pledge_id_idx" ON "public"."event_pledge_items" USING "btree" ("event_pledge_id");



CREATE INDEX "event_pledges_event_id_idx" ON "public"."event_pledges" USING "btree" ("event_id");



CREATE INDEX "events_fts_idx" ON "public"."events" USING "gin" ("fts");



CREATE INDEX "idx_marketplace_listing_images_listing_id" ON "public"."marketplace_listing_images" USING "btree" ("listing_id", "display_order");



CREATE INDEX "idx_marketplace_listings_author_id" ON "public"."marketplace_listings" USING "btree" ("author_id");



CREATE INDEX "idx_marketplace_listings_browse" ON "public"."marketplace_listings" USING "btree" ("status", "category", "created_at" DESC);



CREATE INDEX "idx_pledge_images_pledge_id" ON "public"."pledge_images" USING "btree" ("pledge_id");



CREATE INDEX "idx_pledge_items_pledge_id" ON "public"."pledge_items" USING "btree" ("pledge_id");



CREATE INDEX "idx_pledges_donor_id" ON "public"."pledges" USING "btree" ("donor_id");



CREATE INDEX "idx_pledges_post_id" ON "public"."pledges" USING "btree" ("post_id");



CREATE INDEX "purchase_requests_buyer_created_at_idx" ON "public"."purchase_requests" USING "btree" ("buyer_id", "created_at" DESC);



CREATE INDEX "purchase_requests_post_id_idx" ON "public"."purchase_requests" USING "btree" ("post_id");



CREATE INDEX "purchase_requests_seller_created_at_idx" ON "public"."purchase_requests" USING "btree" ("seller_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "check_self_pledge" BEFORE INSERT ON "public"."pledges" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_self_pledge"();



CREATE OR REPLACE TRIGGER "on_comment_added_or_removed" AFTER INSERT OR DELETE ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_count"();



CREATE OR REPLACE TRIGGER "on_pledge_status_updated" AFTER UPDATE ON "public"."pledges" FOR EACH ROW EXECUTE FUNCTION "public"."handle_pledge_completed"();



CREATE OR REPLACE TRIGGER "on_post_like" AFTER INSERT OR DELETE ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_post_like"();



CREATE OR REPLACE TRIGGER "on_rating_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_community_score"();



CREATE OR REPLACE TRIGGER "sync_cause_requests_fts" BEFORE INSERT OR UPDATE ON "public"."cause_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_cause_requests_fts"();



CREATE OR REPLACE TRIGGER "sync_events_fts" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_events_fts"();



CREATE OR REPLACE TRIGGER "sync_profile_changes" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_posts_on_profile_update"();



ALTER TABLE ONLY "public"."cause_requests"
    ADD CONSTRAINT "cause_requests_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_pledge_items"
    ADD CONSTRAINT "event_pledge_items_event_pledge_id_fkey" FOREIGN KEY ("event_pledge_id") REFERENCES "public"."event_pledges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_pledges"
    ADD CONSTRAINT "event_pledges_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."event_pledges"
    ADD CONSTRAINT "event_pledges_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_listing_images"
    ADD CONSTRAINT "marketplace_listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."pledge_images"
    ADD CONSTRAINT "pledge_images_pledge_id_fkey" FOREIGN KEY ("pledge_id") REFERENCES "public"."pledges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pledge_items"
    ADD CONSTRAINT "pledge_items_pledge_id_fkey" FOREIGN KEY ("pledge_id") REFERENCES "public"."pledges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pledges"
    ADD CONSTRAINT "pledges_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pledges"
    ADD CONSTRAINT "pledges_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."cause_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_images"
    ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."cause_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."cause_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_data"
    ADD CONSTRAINT "profile_data_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_profile_data_fk_fkey" FOREIGN KEY ("profile_data_fk") REFERENCES "public"."profile_data"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ratings"
    ADD CONSTRAINT "user_ratings_ratee_id_fkey" FOREIGN KEY ("ratee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ratings"
    ADD CONSTRAINT "user_ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated insert" ON "public"."marketplace_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow authenticated to insert event pledge items" ON "public"."event_pledge_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to create event pledges" ON "public"."event_pledges" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "donor_id"));



CREATE POLICY "Allow authenticated users to create events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow buyers and sellers to view purchase requests" ON "public"."purchase_requests" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "seller_id")));



CREATE POLICY "Allow buyers to insert purchase requests" ON "public"."purchase_requests" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "buyer_id") AND ("status" = 'pending'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."marketplace_listings" "listing"
  WHERE (("listing"."id" = "purchase_requests"."post_id") AND ("listing"."author_id" = "purchase_requests"."seller_id") AND ("listing"."status" = 'available'::"text") AND ("listing"."author_id" <> ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow donors to update their own event pledges" ON "public"."event_pledges" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "donor_id")) WITH CHECK (("auth"."uid"() = "donor_id"));



CREATE POLICY "Allow logged-in users to create events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow public read access" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on profile_data" ON "public"."profile_data" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to organizations" ON "public"."organizations" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to profile_data" ON "public"."profile_data" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow public to read events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Allow public to view completed pledges" ON "public"."pledges" FOR SELECT USING (("status" = 'completed'::"public"."pledge_status"));



CREATE POLICY "Allow public to view event pledge items" ON "public"."event_pledge_items" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow read access to marketplace listings" ON "public"."marketplace_listings" FOR SELECT USING ((("status" = ANY (ARRAY['available'::"text", 'sold'::"text"])) OR (( SELECT "auth"."uid"() AS "uid") = "author_id")));



CREATE POLICY "Allow select access for purchase requests" ON "public"."purchase_requests" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "seller_id") OR ("post_id" IN ( SELECT "listing"."id"
   FROM "public"."marketplace_listings" "listing"
  WHERE ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Allow users to view event pledges" ON "public"."event_pledges" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read likes" ON "public"."post_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can read ratings" ON "public"."user_ratings" FOR SELECT USING (true);



CREATE POLICY "Anyone can view available marketplace listings" ON "public"."marketplace_listings" FOR SELECT TO "authenticated", "anon" USING (("status" = 'available'::"text"));



CREATE POLICY "Anyone can view images for visible listings" ON "public"."marketplace_listing_images" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."marketplace_listings" "listing"
  WHERE (("listing"."id" = "marketplace_listing_images"."listing_id") AND (("listing"."status" = 'available'::"text") OR ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Anyone can view pledge images" ON "public"."pledge_images" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can delete pledge images" ON "public"."pledge_images" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert pledge images" ON "public"."pledge_images" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert their own marketplace listings" ON "public"."marketplace_listings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Enable insert for authenticated donors" ON "public"."pledges" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "donor_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."cause_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."post_images" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."cause_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."post_images" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for pledge items" ON "public"."pledge_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."pledges"
  WHERE (("pledges"."id" = "pledge_items"."pledge_id") AND ("pledges"."donor_id" = "auth"."uid"())))));



CREATE POLICY "Enable read access for all" ON "public"."cause_requests" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all" ON "public"."post_comments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all" ON "public"."post_images" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."cause_requests" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."post_images" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profile_data" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable select for involved parties" ON "public"."pledges" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "donor_id") OR ("auth"."uid"() IN ( SELECT "cause_requests"."author_id"
   FROM "public"."cause_requests"
  WHERE ("cause_requests"."id" = "pledges"."post_id")))));



CREATE POLICY "Enable select for pledge items" ON "public"."pledge_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."pledges"
  WHERE (("pledges"."id" = "pledge_items"."pledge_id") AND (("pledges"."donor_id" = "auth"."uid"()) OR ("pledges"."post_id" IN ( SELECT "cause_requests"."id"
           FROM "public"."cause_requests"
          WHERE ("cause_requests"."author_id" = "auth"."uid"()))))))));



CREATE POLICY "Enable update for involved parties" ON "public"."pledges" FOR UPDATE USING ((("auth"."uid"() = "donor_id") OR ("auth"."uid"() IN ( SELECT "cause_requests"."author_id"
   FROM "public"."cause_requests"
  WHERE ("cause_requests"."id" = "pledges"."post_id")))));



CREATE POLICY "Sellers can accept pending requests" ON "public"."purchase_requests" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "seller_id") AND ("status" = 'pending'::"text"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "seller_id") AND ("status" = 'accepted'::"text")));



CREATE POLICY "Users can add images to their own listings" ON "public"."marketplace_listing_images" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."marketplace_listings" "listing"
  WHERE (("listing"."id" = "marketplace_listing_images"."listing_id") AND ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete images from their own listings" ON "public"."marketplace_listing_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."marketplace_listings" "listing"
  WHERE (("listing"."id" = "marketplace_listing_images"."listing_id") AND ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete their own likes" ON "public"."post_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own marketplace listings" ON "public"."marketplace_listings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can insert their own likes" ON "public"."post_likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own profile data" ON "public"."profile_data" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own ratings" ON "public"."user_ratings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "rater_id"));



CREATE POLICY "Users can update images for their own listings" ON "public"."marketplace_listing_images" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."marketplace_listings" "listing"
  WHERE (("listing"."id" = "marketplace_listing_images"."listing_id") AND ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."marketplace_listings" "listing"
  WHERE (("listing"."id" = "marketplace_listing_images"."listing_id") AND ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile data" ON "public"."profile_data" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own marketplace listings" ON "public"."marketplace_listings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Users can update their own posts" ON "public"."cause_requests" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile data" ON "public"."profile_data" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own ratings" ON "public"."user_ratings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "rater_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile data" ON "public"."profile_data" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view relevant purchase requests" ON "public"."purchase_requests" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "seller_id") OR ("post_id" IN ( SELECT "listing"."id"
   FROM "public"."marketplace_listings" "listing"
  WHERE ("listing"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."cause_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_pledge_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_pledges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_listing_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pledge_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pledge_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pledges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ratings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";





































































































































































GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cause_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."event_pledge_items" TO "authenticated";



GRANT ALL ON TABLE "public"."event_pledges" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."events" TO "authenticated";
GRANT SELECT ON TABLE "public"."events" TO "anon";



GRANT SELECT ON TABLE "public"."marketplace_listing_images" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."marketplace_listing_images" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_listing_images" TO "service_role";



GRANT SELECT ON TABLE "public"."marketplace_listings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."marketplace_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organizations" TO "service_role";
GRANT SELECT ON TABLE "public"."organizations" TO "authenticated";
GRANT SELECT ON TABLE "public"."organizations" TO "anon";



GRANT ALL ON TABLE "public"."pledge_images" TO "anon";
GRANT ALL ON TABLE "public"."pledge_images" TO "authenticated";
GRANT ALL ON TABLE "public"."pledge_images" TO "service_role";



GRANT ALL ON TABLE "public"."pledge_items" TO "authenticated";



GRANT ALL ON TABLE "public"."pledges" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_comments" TO "authenticated";
GRANT SELECT ON TABLE "public"."post_comments" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_images" TO "authenticated";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."post_likes" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."post_likes" TO "authenticated";



GRANT ALL ON TABLE "public"."profile_data" TO "anon";
GRANT ALL ON TABLE "public"."profile_data" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_data" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."purchase_requests" TO "authenticated";



GRANT UPDATE("status") ON TABLE "public"."purchase_requests" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_ratings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_ratings" TO "authenticated";


































drop extension if exists "pg_net";

drop policy "Anyone can view images for visible listings" on "public"."marketplace_listing_images";

drop policy "Anyone can view available marketplace listings" on "public"."marketplace_listings";

revoke references on table "public"."cause_requests" from "anon";

revoke trigger on table "public"."cause_requests" from "anon";

revoke truncate on table "public"."cause_requests" from "anon";

revoke references on table "public"."cause_requests" from "authenticated";

revoke trigger on table "public"."cause_requests" from "authenticated";

revoke truncate on table "public"."cause_requests" from "authenticated";

revoke references on table "public"."cause_requests" from "service_role";

revoke trigger on table "public"."cause_requests" from "service_role";

revoke truncate on table "public"."cause_requests" from "service_role";

revoke references on table "public"."event_pledge_items" from "anon";

revoke trigger on table "public"."event_pledge_items" from "anon";

revoke truncate on table "public"."event_pledge_items" from "anon";

revoke references on table "public"."event_pledge_items" from "service_role";

revoke trigger on table "public"."event_pledge_items" from "service_role";

revoke truncate on table "public"."event_pledge_items" from "service_role";

revoke references on table "public"."event_pledges" from "anon";

revoke trigger on table "public"."event_pledges" from "anon";

revoke truncate on table "public"."event_pledges" from "anon";

revoke references on table "public"."event_pledges" from "service_role";

revoke trigger on table "public"."event_pledges" from "service_role";

revoke truncate on table "public"."event_pledges" from "service_role";

revoke references on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke references on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke references on table "public"."events" from "service_role";

revoke trigger on table "public"."events" from "service_role";

revoke truncate on table "public"."events" from "service_role";

revoke references on table "public"."marketplace_listing_images" from "anon";

revoke trigger on table "public"."marketplace_listing_images" from "anon";

revoke truncate on table "public"."marketplace_listing_images" from "anon";

revoke references on table "public"."marketplace_listing_images" from "authenticated";

revoke trigger on table "public"."marketplace_listing_images" from "authenticated";

revoke truncate on table "public"."marketplace_listing_images" from "authenticated";

revoke references on table "public"."marketplace_listings" from "anon";

revoke trigger on table "public"."marketplace_listings" from "anon";

revoke truncate on table "public"."marketplace_listings" from "anon";

revoke references on table "public"."marketplace_listings" from "authenticated";

revoke trigger on table "public"."marketplace_listings" from "authenticated";

revoke truncate on table "public"."marketplace_listings" from "authenticated";

revoke references on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke references on table "public"."pledge_items" from "anon";

revoke trigger on table "public"."pledge_items" from "anon";

revoke truncate on table "public"."pledge_items" from "anon";

revoke references on table "public"."pledge_items" from "service_role";

revoke trigger on table "public"."pledge_items" from "service_role";

revoke truncate on table "public"."pledge_items" from "service_role";

revoke references on table "public"."pledges" from "anon";

revoke trigger on table "public"."pledges" from "anon";

revoke truncate on table "public"."pledges" from "anon";

revoke references on table "public"."pledges" from "service_role";

revoke trigger on table "public"."pledges" from "service_role";

revoke truncate on table "public"."pledges" from "service_role";

revoke references on table "public"."post_comments" from "anon";

revoke trigger on table "public"."post_comments" from "anon";

revoke truncate on table "public"."post_comments" from "anon";

revoke references on table "public"."post_comments" from "authenticated";

revoke trigger on table "public"."post_comments" from "authenticated";

revoke truncate on table "public"."post_comments" from "authenticated";

revoke references on table "public"."post_comments" from "service_role";

revoke trigger on table "public"."post_comments" from "service_role";

revoke truncate on table "public"."post_comments" from "service_role";

revoke references on table "public"."post_images" from "anon";

revoke trigger on table "public"."post_images" from "anon";

revoke truncate on table "public"."post_images" from "anon";

revoke references on table "public"."post_images" from "authenticated";

revoke trigger on table "public"."post_images" from "authenticated";

revoke truncate on table "public"."post_images" from "authenticated";

revoke references on table "public"."post_images" from "service_role";

revoke trigger on table "public"."post_images" from "service_role";

revoke truncate on table "public"."post_images" from "service_role";

revoke references on table "public"."post_likes" from "anon";

revoke trigger on table "public"."post_likes" from "anon";

revoke truncate on table "public"."post_likes" from "anon";

revoke references on table "public"."post_likes" from "authenticated";

revoke trigger on table "public"."post_likes" from "authenticated";

revoke truncate on table "public"."post_likes" from "authenticated";

revoke references on table "public"."post_likes" from "service_role";

revoke trigger on table "public"."post_likes" from "service_role";

revoke truncate on table "public"."post_likes" from "service_role";

revoke references on table "public"."purchase_requests" from "anon";

revoke trigger on table "public"."purchase_requests" from "anon";

revoke truncate on table "public"."purchase_requests" from "anon";

revoke references on table "public"."purchase_requests" from "authenticated";

revoke trigger on table "public"."purchase_requests" from "authenticated";

revoke truncate on table "public"."purchase_requests" from "authenticated";

revoke references on table "public"."purchase_requests" from "service_role";

revoke trigger on table "public"."purchase_requests" from "service_role";

revoke truncate on table "public"."purchase_requests" from "service_role";

revoke references on table "public"."user_ratings" from "anon";

revoke trigger on table "public"."user_ratings" from "anon";

revoke truncate on table "public"."user_ratings" from "anon";

revoke references on table "public"."user_ratings" from "authenticated";

revoke trigger on table "public"."user_ratings" from "authenticated";

revoke truncate on table "public"."user_ratings" from "authenticated";

revoke references on table "public"."user_ratings" from "service_role";

revoke trigger on table "public"."user_ratings" from "service_role";

revoke truncate on table "public"."user_ratings" from "service_role";


  create policy "Anyone can view images for visible listings"
  on "public"."marketplace_listing_images"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.marketplace_listings listing
  WHERE ((listing.id = marketplace_listing_images.listing_id) AND ((listing.status = 'available'::text) OR (listing.author_id = ( SELECT auth.uid() AS uid)))))));



  create policy "Anyone can view available marketplace listings"
  on "public"."marketplace_listings"
  as permissive
  for select
  to anon, authenticated
using ((status = 'available'::text));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow Auth Upload 1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'images'::text));



  create policy "Allow authenticated updates"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



  create policy "Allow public viewing"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "AvatarUpload h0za56_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'Avatars'::text));



  create policy "AvatarUpload h0za56_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'Avatars'::text));



  create policy "AvatarUpload h0za56_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'Avatars'::text));
