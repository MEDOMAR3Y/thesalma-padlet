
-- Fix: Recreate all critical policies as PERMISSIVE (default)
-- The issue is all policies were RESTRICTIVE which blocks access

-- ========== POSTS ==========
DROP POLICY IF EXISTS "Users can create posts on accessible boards" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts on accessible boards" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can view posts on accessible boards" ON public.posts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = posts.board_id AND (boards.user_id = auth.uid() OR boards.visibility = 'public'))
  OR user_has_board_access(auth.uid(), board_id)
);

CREATE POLICY "Users can create posts on accessible boards" ON public.posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM boards b WHERE b.id = posts.board_id AND b.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM board_shares bs
      WHERE bs.board_id = posts.board_id
        AND bs.permission IN ('write', 'admin')
        AND (bs.user_id = auth.uid() OR (bs.email IS NOT NULL AND lower(bs.email) = lower(auth.jwt() ->> 'email')))
    )
  )
);

CREATE POLICY "Users can update their own posts" ON public.posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
FOR DELETE USING (auth.uid() = user_id);

-- ========== BOARDS ==========
DROP POLICY IF EXISTS "Users can create their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can view own or shared boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;

CREATE POLICY "Users can create their own boards" ON public.boards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own or shared boards" ON public.boards
FOR SELECT USING (
  auth.uid() = user_id
  OR visibility = 'public'
  OR user_has_board_access(auth.uid(), id)
);

CREATE POLICY "Users can update their own boards" ON public.boards
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.boards
FOR DELETE USING (auth.uid() = user_id);

-- ========== BOARD_SHARES ==========
DROP POLICY IF EXISTS "Board owner can manage shares" ON public.board_shares;
DROP POLICY IF EXISTS "Users can self-associate via token" ON public.board_shares;
DROP POLICY IF EXISTS "Users can view shares on accessible boards" ON public.board_shares;
DROP POLICY IF EXISTS "Users can update own share" ON public.board_shares;

CREATE POLICY "Board owner can manage shares" ON public.board_shares
FOR ALL USING (is_board_owner(auth.uid(), board_id))
WITH CHECK (is_board_owner(auth.uid(), board_id));

CREATE POLICY "Users can self-associate via token" ON public.board_shares
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view shares on accessible boards" ON public.board_shares
FOR SELECT USING (
  user_id = auth.uid()
  OR is_board_owner(auth.uid(), board_id)
  OR EXISTS (
    SELECT 1 FROM board_shares bs
    WHERE bs.board_id = board_shares.board_id
    AND (bs.user_id = auth.uid() OR (bs.email IS NOT NULL AND lower(bs.email) = lower(auth.jwt() ->> 'email')))
  )
);

CREATE POLICY "Users can update own share" ON public.board_shares
FOR UPDATE USING (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
);

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- ========== LIKES ==========
DROP POLICY IF EXISTS "Users can view likes" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;

CREATE POLICY "Users can view likes" ON public.likes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.likes
FOR DELETE USING (auth.uid() = user_id);

-- ========== COMMENTS ==========
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view comments on accessible posts" ON public.comments;

CREATE POLICY "Users can view comments on accessible posts" ON public.comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM posts p JOIN boards b ON b.id = p.board_id
    WHERE p.id = comments.post_id AND (b.user_id = auth.uid() OR b.visibility = 'public')
  )
  OR EXISTS (
    SELECT 1 FROM posts p WHERE p.id = comments.post_id AND user_has_board_access(auth.uid(), p.board_id)
  )
);

CREATE POLICY "Authenticated users can create comments" ON public.comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
FOR DELETE USING (auth.uid() = user_id);

-- ========== FIX MISSING TRIGGER ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Add unique constraint on profiles.user_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
