Prompt 4 — Supabase Row Level Security (Critical)
Design strict Row Level Security (RLS) policies for:
- reports
- votes
- comments
- profiles
- status_updates

Rules:
- Public read access for reports
- Only owners can modify their reports
- One vote per user/device per report
- Comments readable by all, writable by authenticated users

Return SQL policies only.