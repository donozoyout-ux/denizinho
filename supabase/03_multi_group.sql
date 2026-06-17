-- Multi-group membership: users can belong to and own multiple groups

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);

-- Migrate existing single-group memberships
INSERT INTO public.group_members (user_id, group_id, role)
SELECT u.id, u.group_id,
  CASE WHEN g.owner_id = u.id THEN 'owner' ELSE 'member' END
FROM public.users u
JOIN public.groups g ON g.id = u.group_id
WHERE u.group_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memberships" ON public.group_members;
CREATE POLICY "Users can view own memberships"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
CREATE POLICY "Users can view group memberships"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid()
    )
  );
