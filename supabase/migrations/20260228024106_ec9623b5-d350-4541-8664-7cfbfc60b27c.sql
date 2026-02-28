
-- Create security definer function to check board share access
CREATE OR REPLACE FUNCTION public.user_has_board_access(_user_id uuid, _board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM board_shares
    WHERE board_shares.board_id = _board_id
    AND board_shares.user_id = _user_id
  );
$$;

-- Fix boards SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view own or shared boards" ON public.boards;
CREATE POLICY "Users can view own or shared boards" ON public.boards
FOR SELECT USING (
  auth.uid() = user_id 
  OR visibility = 'public'
  OR public.user_has_board_access(auth.uid(), id)
);

-- Fix posts SELECT policy
DROP POLICY IF EXISTS "Users can view posts on accessible boards" ON public.posts;
CREATE POLICY "Users can view posts on accessible boards" ON public.posts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = posts.board_id AND (
    boards.user_id = auth.uid() 
    OR boards.visibility = 'public'
  ))
  OR public.user_has_board_access(auth.uid(), board_id)
);

-- Fix posts INSERT policy
DROP POLICY IF EXISTS "Users can create posts on accessible boards" ON public.posts;
CREATE POLICY "Users can create posts on accessible boards" ON public.posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM boards WHERE boards.id = posts.board_id AND boards.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM board_shares WHERE board_shares.board_id = posts.board_id AND board_shares.user_id = auth.uid() AND board_shares.permission IN ('write', 'admin'))
  )
);

-- Fix comments SELECT policy
DROP POLICY IF EXISTS "Users can view comments on accessible posts" ON public.comments;
CREATE POLICY "Users can view comments on accessible posts" ON public.comments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts p JOIN boards b ON b.id = p.board_id WHERE p.id = comments.post_id AND (
    b.user_id = auth.uid() 
    OR b.visibility = 'public'
  ))
  OR EXISTS (SELECT 1 FROM posts p WHERE p.id = comments.post_id AND public.user_has_board_access(auth.uid(), p.board_id))
);
