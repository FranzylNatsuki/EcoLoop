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
