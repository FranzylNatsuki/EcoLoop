### Tables and their definitions

`profiles` - contains a connection to Supabase Auth and also serves as the user of the session.

## Definition:

```sql
create table public.profiles (
  id uuid not null,
  full_name text not null,
  location text null,
  contact_number text null,
  email text not null,
  is_org boolean not null default false,
  organization_id uuid null,
  role public.user_role not null default 'registered'::user_role,
  created_at timestamp with time zone not null default now(),
  profile_data_fk uuid null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint profiles_profile_data_fk_fkey foreign KEY (profile_data_fk) references profile_data (id)
) TABLESPACE pg_default;

create trigger on_profile_created BEFORE INSERT on profiles for EACH row
execute FUNCTION handle_new_profile ();
```

`profile_data` - is generated alongside profile, contains all needed extra data for the profile page. it's PK is always = to the profiles table PK.

## Definition:

```sql
create table public.profile_data (
  id uuid not null,
  about text null,
  "ItemsDonated" bigint null default 0,
  "ProjectsSupported" bigint null default 0,
  "MaterialsCollected" bigint null default 0,
  "CommunityScore" double precision null default 0.0,
  "Posts" jsonb null default '[]'::jsonb,
  "DonationHistory" jsonb null default '[]'::jsonb,
  "SavedPosts" jsonb null default '[]'::jsonb,
  "Avatar" text null default 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'::text,
  constraint profile_data_pkey primary key (id),
  constraint profile_data_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

`organizations` - if profile isOrg = true, then creates an organization row with org data, is referred to as an FK by profile.

## Definition:

```sql
create table public.profile_data (
  id uuid not null,
  about text null,
  "ItemsDonated" bigint null default 0,
  "ProjectsSupported" bigint null default 0,
  "MaterialsCollected" bigint null default 0,
  "CommunityScore" double precision null default 0.0,
  "Posts" jsonb null default '[]'::jsonb,
  "DonationHistory" jsonb null default '[]'::jsonb,
  "SavedPosts" jsonb null default '[]'::jsonb,
  "Avatar" text null default 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'::text,
  constraint profile_data_pkey primary key (id),
  constraint profile_data_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

`cause_requests` - essentially jsut posts.

```sql
create table public.cause_requests (
  id uuid not null default gen_random_uuid (),
  author_id uuid not null,
  title text not null,
  body text not null,
  category text not null,
  vote_count integer not null default 0,
  comment_count integer not null default 0,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  constraint cause_requests_pkey primary key (id),
  constraint cause_requests_author_id_fkey foreign KEY (author_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
```

`post_comments` - a post's comments

```sql
create table public.post_comments (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  author_id uuid not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  constraint post_comments_pkey primary key (id),
  constraint post_comments_author_id_fkey foreign KEY (author_id) references profiles (id) on delete CASCADE,
  constraint post_comments_post_id_fkey foreign KEY (post_id) references cause_requests (id) on delete CASCADE
) TABLESPACE pg_default;
```

`post_images` - referenced by post to retrieve image links.

```sql
create table public.post_images (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  image_url text not null,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint post_images_pkey primary key (id),
  constraint post_images_post_id_fkey foreign KEY (post_id) references cause_requests (id) on delete CASCADE
) TABLESPACE pg_default;
```

`events` - event entity

```sql
create table public.events (
  id uuid not null default gen_random_uuid (),
  author_id uuid not null,
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  event_date timestamp with time zone not null,
  banner_url text null,
  materials_needed jsonb null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint events_pkey primary key (id),
  constraint events_author_id_fkey foreign KEY (author_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
```

`pledges` - essentially a donation

```sql
create table public.pledges (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  donor_id uuid not null,
  title text not null,
  description text null,
  pickup_preference text not null default 'deliver'::text,
  location_address text null,
  status public.pledge_status not null default 'pending'::pledge_status,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  latitude double precision null,
  longitude double precision null,
  constraint pledges_pkey primary key (id),
  constraint pledges_donor_id_fkey foreign KEY (donor_id) references profiles (id) on delete CASCADE,
  constraint pledges_post_id_fkey foreign KEY (post_id) references cause_requests (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pledges_post_id on public.pledges using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_pledges_donor_id on public.pledges using btree (donor_id) TABLESPACE pg_default;

create trigger on_pledge_status_updated
after
update on pledges for EACH row
execute FUNCTION handle_pledge_completed ();
```

`pledge_items` - list of all units donated, connected to pledges

```sql
create table public.pledge_items (
  id uuid not null default gen_random_uuid (),
  pledge_id uuid not null,
  material_name text not null,
  quantity integer not null,
  unit text null default 'units'::text,
  created_at timestamp with time zone not null default now(),
  constraint pledge_items_pkey primary key (id),
  constraint pledge_items_pledge_id_fkey foreign KEY (pledge_id) references pledges (id) on delete CASCADE,
  constraint pledge_items_quantity_check check ((quantity > 0))
) TABLESPACE pg_default;

create index IF not exists idx_pledge_items_pledge_id on public.pledge_items using btree (pledge_id) TABLESPACE pg_default;
```

`event_pledges` - table to store event pledges, similar to pledges

```sql 
create table public.event_pledges (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  donor_id uuid not null,
  title text not null,
  description text null,
  pickup_preference text not null default 'deliver'::text,
  location_address text null,
  latitude double precision null,
  longitude double precision null,
  status public.pledge_status not null default 'pending'::pledge_status,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint event_pledges_pkey primary key (id),
  constraint event_pledges_donor_id_fkey foreign KEY (donor_id) references profiles (id),
  constraint event_pledges_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists event_pledges_event_id_idx on public.event_pledges using btree (event_id) TABLESPACE pg_default;
```

`event_pledge_items` - 
```sql 
create table public.event_pledge_items (
  id uuid not null default gen_random_uuid (),
  event_pledge_id uuid not null,
  material_name text not null,
  quantity integer not null,
  unit text null default 'units'::text,
  created_at timestamp with time zone not null default now(),
  constraint event_pledge_items_pkey primary key (id),
  constraint event_pledge_items_event_pledge_id_fkey foreign KEY (event_pledge_id) references event_pledges (id) on delete CASCADE,
  constraint event_pledge_items_quantity_check check ((quantity > 0))
) TABLESPACE pg_default;

create index IF not exists event_pledge_items_event_pledge_id_idx on public.event_pledge_items using btree (event_pledge_id) TABLESPACE pg_default;
```

`marketplace_listings` - 
```sql
create table public.marketplace_listings (
  id uuid not null default gen_random_uuid (),
  author_id uuid not null,
  title text not null,
  description text not null,
  category text not null,
  post_type text not null default 'marketplace'::text,
  pricing_type text not null default 'For Sale'::text,
  pricing_structure text not null default 'Per Unit / kg'::text,
  price numeric(12, 2) null,
  quantity numeric(12, 3) null,
  quantity_unit text not null default 'pcs'::text,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint marketplace_listings_pkey primary key (id),
  constraint marketplace_listings_author_id_fkey foreign KEY (author_id) references profiles (id) on delete CASCADE,
  constraint marketplace_listings_description_check check (
    (
      (char_length(btrim(description)) >= 1)
      and (char_length(btrim(description)) <= 5000)
    )
  ),
  constraint marketplace_listings_post_type_check check ((post_type = 'marketplace'::text)),
  constraint marketplace_listings_price_check check (
    (
      (price is null)
      or (price >= (0)::numeric)
    )
  ),
  constraint marketplace_listings_pricing_structure_check check (
    (
      pricing_structure = any (
        array[
          'Per Unit / kg'::text,
          'Bulk Bundle (e.g., per 20 pcs)'::text,
          'Total Lot Price (Price for All)'::text
        ]
      )
    )
  ),
  constraint marketplace_listings_pricing_type_check check (
    (
      pricing_type = any (array['For Sale'::text, 'Free/Donation'::text])
    )
  ),
  constraint marketplace_listings_quantity_check check (
    (
      (quantity is null)
      or (quantity >= (0)::numeric)
    )
  ),
  constraint marketplace_listings_quantity_unit_check check (
    (
      quantity_unit = any (
        array[
          'pcs'::text,
          'kg'::text,
          'items'::text,
          'lots'::text
        ]
      )
    )
  ),
  constraint marketplace_listings_status_check check (
    (
      status = any (
        array['active'::text, 'sold'::text, 'archived'::text]
      )
    )
  ),
  constraint marketplace_listings_title_check check (
    (
      (char_length(btrim(title)) >= 1)
      and (char_length(btrim(title)) <= 200)
    )
  ),
  constraint marketplace_free_listing_no_price check (
    (
      (pricing_type <> 'Free/Donation'::text)
      or (price is null)
    )
  ),
  constraint marketplace_sale_listing_has_price check (
    (
      (pricing_type <> 'For Sale'::text)
      or (price is not null)
    )
  ),
  constraint marketplace_listings_category_check check (
    (
      category = any (
        array[
          'Plastics'::text,
          'Glass'::text,
          'Paper/Cardboard'::text,
          'Metal'::text,
          'Electronics'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_marketplace_listings_author_id on public.marketplace_listings using btree (author_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_listings_browse on public.marketplace_listings using btree (status, category, created_at desc) TABLESPACE pg_default;
```

`marketplace_listing_images` - 
```sql
create table public.marketplace_listing_images (
  id uuid not null default gen_random_uuid (),
  listing_id uuid not null,
  image_url text not null,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint marketplace_listing_images_pkey primary key (id),
  constraint marketplace_listing_images_listing_id_fkey foreign KEY (listing_id) references marketplace_listings (id) on delete CASCADE,
  constraint marketplace_listing_images_display_order_check check ((display_order >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_marketplace_listing_images_listing_id on public.marketplace_listing_images using btree (listing_id, display_order) TABLESPACE pg_default;
```

`master trigger` - behaviour for registration

```sql
-- 1. Wipe all conflicting old triggers and functions
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_created on profiles;
drop function if exists public.handle_new_user();
drop function if exists handle_new_profile();

-- 2. Create the robust two-table insertion function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- STEP A: Create the Profile Data row FIRST (Fixes error 23503)
  insert into public.profile_data (id)
  values (new.id);

  -- STEP B: Create the Profile with coalesce safety nets (Fixes error 23502)
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    location, 
    contact_number, 
    is_org,
    profile_data_fk
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Unknown User'), -- Prevents null crash
    new.raw_user_meta_data ->> 'location',
    new.raw_user_meta_data ->> 'contact_number',
    coalesce((new.raw_user_meta_data ->> 'is_org')::boolean, false),
    new.id
  );
  
  return new;
end;
$$;

-- 3. Attach the fresh trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

`public.prevent_self_pledge()`

```sql
-- 1. Create the verification function
create or replace function public.prevent_self_pledge()
returns trigger
language plpgsql
security definer
as $$
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

-- 2. Attach it to the pledges table
create trigger check_self_pledge
  before insert on public.pledges
  for each row execute procedure public.prevent_self_pledge();
```
