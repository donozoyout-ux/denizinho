-- Fix RLS policies for user profile updates and backfill group_id on legacy rows

-- Remove conflicting legacy policy (only patron could update users)
DROP POLICY IF EXISTS "Patron can update user roles" ON public.users;

-- Ensure users can update their own profile (including group_id on invite accept)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Backfill group_id on tasks from creator or assignee
UPDATE public.tasks t
SET group_id = u.group_id
FROM public.users u
WHERE t.group_id IS NULL
  AND (t.created_by = u.id OR t.assigned_to = u.id)
  AND u.group_id IS NOT NULL;

-- Backfill group_id on projects from creator
UPDATE public.projects p
SET group_id = u.group_id
FROM public.users u
WHERE p.group_id IS NULL
  AND p.created_by = u.id
  AND u.group_id IS NOT NULL;

-- Backfill group_id on incoming_requests via group's owner (best effort)
UPDATE public.incoming_requests ir
SET group_id = g.id
FROM public.groups g
WHERE ir.group_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.group_id = g.id AND u.role = 'patron'
    LIMIT 1
  );

-- Performance: composite index for dashboard task listing
CREATE INDEX IF NOT EXISTS tasks_group_created_idx ON public.tasks(group_id, created_at DESC);

-- Performance: pending incoming requests by group
CREATE INDEX IF NOT EXISTS incoming_requests_status_group_idx
  ON public.incoming_requests(status, group_id);
