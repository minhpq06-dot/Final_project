-- Apply once to a fresh Supabase project. No destructive resets.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 full_name text not null check(length(full_name) between 2 and 80),
 university text not null default '' check(length(university)<=120), major text not null default '' check(length(major)<=120),
 bio text not null default '' check(length(bio)<=1000), skills text[] not null default '{}' check(cardinality(skills)<=20),
 desired_roles text[] not null default '{}' check(cardinality(desired_roles)<=20),
 commitment text not null default 'medium' check(commitment in ('high','medium','flexible')),
 experience text not null default '' check(length(experience)<=1500),
 portfolio_url text not null default '' check(length(portfolio_url)<=500 and (portfolio_url='' or portfolio_url ~ '^https?://[^[:space:]@]+$')),
 created_at timestamptz not null default now()
);
create table public.competitions (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 2 and 140), organizer text not null,
 category text not null, description text not null, deadline timestamptz not null,
 min_team_size int not null check(min_team_size>=2), max_team_size int not null check(max_team_size between min_team_size and 10),
 location text not null default '', information_url text not null default '' check(information_url='' or information_url ~ '^https?://[^[:space:]@]+$'), accent text not null default 'violet'
);
create table public.teams (
 id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions,
 captain_id uuid not null references public.profiles, name text not null check(length(name) between 2 and 80),
 description text not null check(length(description) between 20 and 2000), commitment text not null check(commitment in ('high','medium','flexible')),
 status text not null default 'recruiting' check(status in ('open','recruiting','full','closed')), created_at timestamptz not null default now(), unique(id,competition_id)
);
create table public.team_roles (
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams on delete cascade,
 name text not null check(length(name) between 2 and 60), skills text[] not null check(cardinality(skills) between 1 and 20), slots int not null check(slots between 1 and 9), unique(id,team_id)
);
create unique index role_name_unique on public.team_roles(team_id,lower(name));
create table public.applications (
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams on delete cascade, role_id uuid not null,
 applicant_id uuid not null references public.profiles, message text not null check(length(message) between 20 and 1500),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn')), created_at timestamptz not null default now(),
 foreign key(role_id,team_id) references public.team_roles(id,team_id), unique(team_id,applicant_id)
);
create table public.team_members (
 id uuid primary key default gen_random_uuid(), team_id uuid not null, competition_id uuid not null,
 user_id uuid not null references public.profiles, role_id uuid, role_name text not null, joined_at timestamptz not null default now(),
 foreign key(team_id,competition_id) references public.teams(id,competition_id) on delete cascade,
 foreign key(role_id,team_id) references public.team_roles(id,team_id), unique(competition_id,user_id), unique(team_id,user_id)
);
create table public.saved_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 team_id uuid references public.teams on delete cascade, competition_id uuid references public.competitions on delete cascade,
 check(num_nonnulls(team_id,competition_id)=1), unique(user_id,team_id), unique(user_id,competition_id)
);
create index teams_competition_idx on public.teams(competition_id);
create index teams_captain_idx on public.teams(captain_id);
create index roles_team_idx on public.team_roles(team_id);
create index applications_applicant_idx on public.applications(applicant_id);
create index members_role_idx on public.team_members(role_id);

alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.team_roles enable row level security;
alter table public.applications enable row level security;
alter table public.team_members enable row level security;
alter table public.saved_items enable row level security;
revoke all on public.profiles,public.competitions,public.teams,public.team_roles,public.applications,public.team_members,public.saved_items from anon,authenticated;
grant select on public.competitions,public.teams,public.team_roles,public.team_members to anon,authenticated;
grant select on public.profiles,public.applications,public.saved_items to authenticated;
grant update(full_name,university,major,bio,skills,desired_roles,commitment,experience,portfolio_url) on public.profiles to authenticated;
grant insert,delete on public.saved_items to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(true);
create policy profile_edit on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy competitions_read on public.competitions for select to anon,authenticated using(true);
create policy teams_read on public.teams for select to anon,authenticated using(true);
create policy roles_read on public.team_roles for select to anon,authenticated using(true);
create policy members_read on public.team_members for select to anon,authenticated using(true);
create policy application_read on public.applications for select to authenticated using(applicant_id=(select auth.uid()) or exists(select 1 from public.teams t where t.id=team_id and t.captain_id=(select auth.uid())));
create policy saved_own on public.saved_items for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'full_name'),80),''),'Thành viên mới'));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Only these checked transactions can mutate teams, applications or rosters.
-- SECURITY DEFINER is intentional: RLS grants no direct writes to those tables.
create function public.create_team(p_competition uuid,p_name text,p_description text,p_commitment text,p_roles jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); comp public.competitions; tid uuid; r jsonb; total int:=1;
begin
 if uid is null then raise exception 'Đăng nhập để tiếp tục.'; end if;
 perform 1 from public.profiles where id=uid for update;
 select * into comp from public.competitions where id=p_competition;
 if comp.id is null or comp.deadline<=now() then raise exception 'Cuộc thi đã hết hạn hoặc không tồn tại.'; end if;
 if exists(select 1 from public.team_members where competition_id=p_competition and user_id=uid) then raise exception 'Bạn đã thuộc một đội trong cuộc thi này.'; end if;
 if p_roles is null or jsonb_typeof(p_roles)<>'array' then raise exception 'Danh sách vai trò không hợp lệ.'; end if;
 if jsonb_array_length(p_roles) not between 1 and 9 then raise exception 'Cần từ 1 đến 9 vai trò.'; end if;
 for r in select value from jsonb_array_elements(p_roles) loop
  if r->>'slots' is null or (r->>'slots') !~ '^[1-9]$' or jsonb_typeof(r->'skills') is distinct from 'array' then raise exception 'Vai trò không hợp lệ.'; end if;
  total:=total+(r->>'slots')::int;
 end loop;
 if total<comp.min_team_size or total>comp.max_team_size then raise exception 'Số chỗ không đúng quy định cuộc thi.'; end if;
 insert into public.teams(competition_id,captain_id,name,description,commitment) values(p_competition,uid,trim(p_name),trim(p_description),p_commitment) returning id into tid;
 for r in select value from jsonb_array_elements(p_roles) loop
  insert into public.team_roles(team_id,name,skills,slots) values(tid,trim(r->>'name'),array(select jsonb_array_elements_text(r->'skills')),(r->>'slots')::int);
 end loop;
 insert into public.team_members(team_id,competition_id,user_id,role_name) values(tid,p_competition,uid,'Captain');
 return tid;
end $$;
create function public.edit_team(p_team uuid,p_name text,p_description text,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare t public.teams;
begin
 select * into t from public.teams where id=p_team for update;
 if auth.uid() is null or t.captain_id is distinct from auth.uid() then raise exception 'Chỉ captain được sửa đội.'; end if;
 if p_status is null or p_status not in ('open','recruiting','closed') then raise exception 'Trạng thái không hợp lệ.'; end if;
 if p_status<>'closed' and not exists(select 1 from public.team_roles r where r.team_id=p_team and r.slots>(select count(*) from public.team_members m where m.role_id=r.id)) then p_status:='full'; end if;
 update public.teams set name=trim(p_name),description=trim(p_description),status=p_status where id=p_team;
end $$;
create function public.apply_to_team(p_team uuid,p_role uuid,p_message text) returns void language plpgsql security definer set search_path='' as $$
declare t public.teams; uid uuid:=auth.uid(); r public.team_roles;
begin
 if uid is null then raise exception 'Đăng nhập để tiếp tục.'; end if;
 perform 1 from public.profiles where id=uid for update;
 select * into t from public.teams where id=p_team for update;
 if t.id is null or t.status not in ('open','recruiting') or not exists(select 1 from public.competitions where id=t.competition_id and deadline>now()) then raise exception 'Đội không còn nhận đơn.'; end if;
 if exists(select 1 from public.team_members where competition_id=t.competition_id and user_id=uid) then raise exception 'Bạn đã thuộc một đội trong cuộc thi này.'; end if;
 select * into r from public.team_roles where id=p_role and team_id=p_team;
 if r.id is null or r.slots<=(select count(*) from public.team_members where role_id=p_role) then raise exception 'Vai trò đã đủ người.'; end if;
 insert into public.applications(team_id,role_id,applicant_id,message) values(p_team,p_role,uid,trim(p_message));
end $$;
create function public.review_application(p_application uuid,p_decision text) returns void language plpgsql security definer set search_path='' as $$
declare a public.applications; t public.teams; c public.competitions; r public.team_roles;
begin
 if auth.uid() is null or p_decision is null or p_decision not in ('accepted','rejected') then raise exception 'Quyết định không hợp lệ.'; end if;
 select * into a from public.applications where id=p_application;
 if a.id is null then raise exception 'Không tìm thấy đơn.'; end if;
 -- Consistent lock order: candidate, team, application. Serializes cross-team acceptance too.
 perform 1 from public.profiles where id=a.applicant_id for update;
 select * into t from public.teams where id=a.team_id for update;
 if t.captain_id<>auth.uid() then raise exception 'Chỉ captain được duyệt đơn.'; end if;
 select * into a from public.applications where id=p_application for update;
 if a.status<>'pending' then raise exception 'Đơn không còn chờ xử lý.'; end if;
 if p_decision='accepted' then
  select * into c from public.competitions where id=t.competition_id;
  select * into r from public.team_roles where id=a.role_id;
  if t.status not in ('open','recruiting') or c.deadline<=now() or (select count(*) from public.team_members where team_id=t.id)>=c.max_team_size or (select count(*) from public.team_members where role_id=r.id)>=r.slots then raise exception 'Đội đã đủ người hoặc hết hạn.'; end if;
  if exists(select 1 from public.team_members where competition_id=c.id and user_id=a.applicant_id) then raise exception 'Ứng viên đã thuộc một đội trong cuộc thi này.'; end if;
  insert into public.team_members(team_id,competition_id,user_id,role_id,role_name) values(t.id,c.id,a.applicant_id,r.id,r.name);
  update public.applications set status='withdrawn' where applicant_id=a.applicant_id and status='pending' and id<>a.id and team_id in(select id from public.teams where competition_id=c.id);
  if (select count(*) from public.team_members where team_id=t.id)>=c.max_team_size or not exists(select 1 from public.team_roles x where x.team_id=t.id and x.slots>(select count(*) from public.team_members m where m.role_id=x.id)) then update public.teams set status='full' where id=t.id; end if;
 end if;
 update public.applications set status=p_decision where id=a.id;
end $$;
create function public.withdraw_application(p_application uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Đăng nhập để tiếp tục.'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 update public.applications set status='withdrawn' where id=p_application and applicant_id=auth.uid() and status='pending';
 if not found then raise exception 'Không thể rút đơn.'; end if;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;
revoke all on function public.create_team(uuid,text,text,text,jsonb),public.edit_team(uuid,text,text,text),public.apply_to_team(uuid,uuid,text),public.review_application(uuid,text),public.withdraw_application(uuid) from public,anon;
grant execute on function public.create_team(uuid,text,text,text,jsonb),public.edit_team(uuid,text,text,text),public.apply_to_team(uuid,uuid,text),public.review_application(uuid,text),public.withdraw_application(uuid) to authenticated;
create or replace function public.create_team(p_competition uuid,p_name text,p_description text,p_commitment text,p_roles jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); comp public.competitions; tid uuid; r jsonb; total int:=1;
begin
 if uid is null then raise exception 'Đăng nhập để tiếp tục.'; end if;
 perform 1 from public.profiles where id=uid for update;
 select * into comp from public.competitions where id=p_competition;
 if comp.id is null or comp.deadline<=now() then raise exception 'Cuộc thi đã hết hạn hoặc không tồn tại.'; end if;
 if exists(select 1 from public.team_members where competition_id=p_competition and user_id=uid) then raise exception 'Bạn đã thuộc một đội trong cuộc thi này.'; end if;
 if p_roles is null or jsonb_typeof(p_roles)<>'array' or jsonb_array_length(p_roles) not between 1 and 9 then raise exception 'Danh sách vai trò không hợp lệ.'; end if;
 for r in select value from jsonb_array_elements(p_roles) loop
  if r->>'name' is null or length(trim(r->>'name')) not between 2 and 60 or r->>'slots' is null or (r->>'slots') !~ '^[1-9]$' or jsonb_typeof(r->'skills') is distinct from 'array' or jsonb_array_length(r->'skills')<1 then raise exception 'Vai trò không hợp lệ.'; end if;
  total:=total+(r->>'slots')::int;
 end loop;
 if total<comp.min_team_size or total>comp.max_team_size then raise exception 'Số chỗ không đúng quy định cuộc thi.'; end if;
 insert into public.teams(competition_id,captain_id,name,description,commitment) values(p_competition,uid,trim(p_name),trim(p_description),p_commitment) returning id into tid;
 for r in select value from jsonb_array_elements(p_roles) loop
  insert into public.team_roles(team_id,name,skills,slots) values(tid,trim(r->>'name'),array(select jsonb_array_elements_text(r->'skills')),(r->>'slots')::int);
 end loop;
 insert into public.team_members(team_id,competition_id,user_id,role_name) values(tid,p_competition,uid,'Captain');
 return tid;
end $$;
