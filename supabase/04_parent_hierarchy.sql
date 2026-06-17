-- Alt görev ve alt proje desteği
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS tasks_parent_id_idx ON public.tasks(parent_id);
CREATE INDEX IF NOT EXISTS projects_parent_id_idx ON public.projects(parent_id);
