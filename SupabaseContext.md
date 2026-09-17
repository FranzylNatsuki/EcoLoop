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
