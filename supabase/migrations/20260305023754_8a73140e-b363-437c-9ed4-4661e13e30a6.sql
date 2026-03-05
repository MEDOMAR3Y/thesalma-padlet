-- Make collaboration policies permissive and fix write access via public link

-- board_shares policies
DROP POLICY IF EXISTS "Board owner can manage shares" ON public.board_shares;
DROP POLICY IF EXISTS "Users can self-associate via token" ON public.board_shares;
DROP POLICY IF EXISTS "Users can view shares on accessible boards" ON public.board_shares;
DROP POLICY IF EXISTS "Users can update own share" ON public.board_shares;

CREATE POLICY "Board owner can manage shares"
ON public.board_shares
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_board_owner(auth.uid(), board_id))
WITH CHECK (public.is_board_owner(auth.uid(), board_id));

CREATE POLICY "Users can view own share rows"
ON public.board_shares
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  OR public.is_board_owner(auth.uid(), board_id)
);

CREATE POLICY "Users can update own share"
ON public.board_shares
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
)
WITH CHECK (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
);

-- boards visibility policy should be permissive
DROP POLICY IF EXISTS "Users can view own or shared boards" ON public.boards;
CREATE POLICY "Users can view own or shared boards"
ON public.boards
AS PERMISSIVE
FOR SELECT
TO authenticated, anon
USING (
  auth.uid() = user_id
  OR visibility = 'public'
  OR public.user_has_board_access(auth.uid(), id)
);

-- posts select policy should be permissive for public/shared access
DROP POLICY IF EXISTS "Users can view posts on accessible boards" ON public.posts;
CREATE POLICY "Users can view posts on accessible boards"
ON public.posts
AS PERMISSIVE
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = posts.board_id
      AND (
        b.visibility = 'public'
        OR b.user_id = auth.uid()
        OR public.user_has_board_access(auth.uid(), b.id)
      )
  )
);

-- FIX: allow creating posts on public boards for authenticated users with link
DROP POLICY IF EXISTS "Users can create posts on accessible boards" ON public.posts;
CREATE POLICY "Users can create posts on accessible boards"
ON public.posts
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = posts.board_id
      AND (
        b.user_id = auth.uid()
        OR b.visibility = 'public'
        OR EXISTS (
          SELECT 1
          FROM public.board_shares bs
          WHERE bs.board_id = posts.board_id
            AND bs.permission = ANY (ARRAY['write', 'admin'])
            AND (
              bs.user_id = auth.uid()
              OR (bs.email IS NOT NULL AND lower(bs.email) = lower(auth.jwt() ->> 'email'))
            )
        )
      )
  )
);