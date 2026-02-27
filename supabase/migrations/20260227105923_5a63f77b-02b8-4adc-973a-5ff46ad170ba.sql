
-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link', 'file')),
  color TEXT DEFAULT '#ffffff',
  link_url TEXT,
  file_url TEXT,
  file_name TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Post visible if user owns board OR board is public
CREATE POLICY "Users can view posts on their boards"
  ON public.posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = posts.board_id AND (boards.user_id = auth.uid() OR boards.visibility = 'public'))
  );

CREATE POLICY "Users can create posts on their boards"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = posts.board_id AND boards.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible posts"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.boards b ON b.id = p.board_id
      WHERE p.id = comments.post_id AND (b.user_id = auth.uid() OR b.visibility = 'public')
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for post files
INSERT INTO storage.buckets (id, name, public) VALUES ('post-files', 'post-files', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload post files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-files' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view post files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-files');

CREATE POLICY "Users can delete their own post files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-files' AND auth.uid()::text = (storage.foldername(name))[1]);
