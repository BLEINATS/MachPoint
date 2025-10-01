/*
# [Operation] Rename 'rank' column
Renames the 'rank' column in 'gamification_levels' to 'level_rank' to avoid conflicts with the SQL reserved keyword 'RANK'.
This is a structural change and should be safe.
## Query Description: [This operation renames a column that causes API errors due to being a reserved keyword. It's a low-risk structural change that doesn't affect data. No backup is strictly required, but it's always good practice.]
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
## Structure Details:
- Tables: public.gamification_levels
- Columns: rank -> level_rank
## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges]
## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. It's a metadata change.]
*/
ALTER TABLE public.gamification_levels RENAME COLUMN rank TO level_rank;
