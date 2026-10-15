-- Images attached to event pledges (mirrors public.pledge_images for cause pledges)
CREATE TABLE IF NOT EXISTS "public"."event_pledge_images" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "event_pledge_id" uuid NOT NULL REFERENCES "public"."event_pledges"("id") ON DELETE CASCADE,
    "image_url" text NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_event_pledge_images_pledge_id"
    ON "public"."event_pledge_images" ("event_pledge_id");

ALTER TABLE "public"."event_pledge_images" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event pledge images"
    ON "public"."event_pledge_images" FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert event pledge images"
    ON "public"."event_pledge_images" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Authenticated users can delete event pledge images"
    ON "public"."event_pledge_images" FOR DELETE TO "authenticated" USING (true);

GRANT ALL ON TABLE "public"."event_pledge_images" TO "anon";
GRANT ALL ON TABLE "public"."event_pledge_images" TO "authenticated";
GRANT ALL ON TABLE "public"."event_pledge_images" TO "service_role";
