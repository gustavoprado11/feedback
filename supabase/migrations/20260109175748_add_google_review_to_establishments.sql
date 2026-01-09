alter table establishments
  add column if not exists google_review_enabled boolean not null default false,
  add column if not exists google_review_url text;
