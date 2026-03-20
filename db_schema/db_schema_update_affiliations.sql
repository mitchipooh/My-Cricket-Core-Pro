-- --- MIGRATION: Organization Affiliations ---

-- Create a junction table for parent-child organization relationships
-- This supports many-to-many relationships (e.g. an Assn affiliating with multiple Zones, or a Club with a League and a Zone)

create table if not exists public.organization_affiliations (
  parent_org_id text references public.organizations(id),
  child_org_id text references public.organizations(id),
  status text default 'APPROVED', -- 'PENDING', 'APPROVED', 'REJECTED'
  created_at timestamptz default now(),
  primary key (parent_org_id, child_org_id)
);

-- Enable RLS
alter table public.organization_affiliations enable row level security;

-- Policies
drop policy if exists "Read Affiliations" on public.organization_affiliations;
create policy "Read Affiliations" on public.organization_affiliations for select using (true);

drop policy if exists "Upsert Affiliations" on public.organization_affiliations;
create policy "Upsert Affiliations" on public.organization_affiliations for all using (true);

