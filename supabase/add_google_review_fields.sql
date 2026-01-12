alter table establishments
  add column if not exists google_review_url text,
  add column if not exists show_google_review_prompt boolean default false;
