-- 在 Supabase SQL Editor 中一次执行。公开浏览器无权直接访问数据表。
create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  thread text not null check (thread ~ '^/(guestbook|posts/[a-z0-9]+(-[a-z0-9]+)*)$' and length(thread) <= 160),
  parent_id uuid references public.blog_comments(id) on delete set null,
  nickname text not null check (char_length(trim(nickname)) between 1 and 24),
  avatar text not null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  is_author boolean not null default false,
  client_hash text,
  created_at timestamptz not null default now()
);
-- 重跑脚本时也为已存在的留言表扩展头像选项，保留原有数据。
alter table public.blog_comments drop constraint if exists blog_comments_avatar_check;
alter table public.blog_comments add constraint blog_comments_avatar_check
  check (avatar in ('cat', 'rabbit', 'fox', 'bird', 'bear', 'deer', 'penguin'));
alter table public.blog_comments enable row level security;
revoke all on public.blog_comments from anon, authenticated;
grant all on public.blog_comments to service_role;
create index if not exists blog_comments_thread_date on public.blog_comments(thread, created_at desc, id desc) where status = 'approved';
create index if not exists blog_comments_rate on public.blog_comments(client_hash, created_at desc) where client_hash is not null;

create or replace function public.submit_blog_comment(
  p_thread text, p_nickname text, p_avatar text, p_body text, p_parent uuid, p_client_hash text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare new_id uuid;
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_client';
  end if;
  -- 同一来源的并发提交也串行校验，每分钟最多一条。
  perform pg_advisory_xact_lock(hashtextextended(p_client_hash, 0));
  if exists(select 1 from public.blog_comments where client_hash = p_client_hash and created_at > now() - interval '1 minute') then
    raise exception using message = 'rate_limited', errcode = 'P0001';
  end if;
  if p_parent is not null and not exists(
    select 1 from public.blog_comments where id = p_parent and thread = p_thread and status = 'approved'
  ) then
    raise exception using message = 'invalid_parent', errcode = 'P0001';
  end if;
  insert into public.blog_comments(thread, nickname, avatar, body, parent_id, client_hash)
    values (p_thread, trim(p_nickname), p_avatar, trim(p_body), p_parent, p_client_hash)
    returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_blog_comment(text,text,text,text,uuid,text) from public, anon, authenticated;
grant execute on function public.submit_blog_comment(text,text,text,text,uuid,text) to service_role;
