-- 1. Create Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add group_id to existing tables
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.incoming_requests ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Default group_id for existing tasks and projects (assign to owner's group, if any)
-- (In a real migration you'd migrate data carefully, but here we just add the columns and let RLS use them going forward).

-- 4. Enable RLS on new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 5. Helper function to get current user's group_id
CREATE OR REPLACE FUNCTION public.get_current_group_id()
RETURNS UUID AS $$
  SELECT group_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. DROP old RLS policies that rely on patron
DROP POLICY IF EXISTS "Patron can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Patron can do everything with tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can read assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can mark own tasks as done" ON public.tasks;
DROP POLICY IF EXISTS "Patron can manage incoming requests" ON public.incoming_requests;
DROP POLICY IF EXISTS "Patron can update user roles" ON public.users;
DROP POLICY IF EXISTS "Users can read all projects" ON public.projects;

-- 7. NEW RLS Policies based on Group ID
-- Users can see and update their own profile and profiles in their group
CREATE POLICY "Users can read group members"
  ON public.users FOR SELECT
  TO authenticated
  USING (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()) OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Projects: accessible by group members
CREATE POLICY "Group members can manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()))
  WITH CHECK (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()));

-- Tasks: accessible by group members
CREATE POLICY "Group members can manage tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()))
  WITH CHECK (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()));

-- Incoming Requests: accessible by group members
CREATE POLICY "Group members can manage incoming requests"
  ON public.incoming_requests FOR ALL
  TO authenticated
  USING (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()))
  WITH CHECK (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()));

-- Groups: Any authenticated user can view (to allow foreign key constraint checking), Owner can update/delete
CREATE POLICY "Members can view their group"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can manage group"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Invitations: Inviter or Invitee can view, Inviter can insert
CREATE POLICY "Inviter and invitee can view invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Members can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (group_id = (SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()));

CREATE POLICY "Invitee can update invitation"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- 8. Update handle_new_user trigger (removed invited_by)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, telegram_chat_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'team_member',
    NEW.raw_user_meta_data->>'telegram_chat_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS users_group_id_idx ON public.users(group_id);
CREATE INDEX IF NOT EXISTS projects_group_id_idx ON public.projects(group_id);
CREATE INDEX IF NOT EXISTS tasks_group_id_idx ON public.tasks(group_id);
CREATE INDEX IF NOT EXISTS incoming_requests_group_id_idx ON public.incoming_requests(group_id);
CREATE INDEX IF NOT EXISTS invitations_group_id_idx ON public.invitations(group_id);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.invitations(lower(email));
