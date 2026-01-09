-- Add weekly report field to establishments
alter table establishments
  add column if not exists weekly_report_enabled boolean default false;
