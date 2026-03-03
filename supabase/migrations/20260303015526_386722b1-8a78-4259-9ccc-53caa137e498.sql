CREATE OR REPLACE FUNCTION public.user_has_board_access(_user_id uuid, _board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.board_shares bs
    WHERE bs.board_id = _board_id
      AND bs.permission <> 'blocked'
      AND (
        bs.user_id = _user_id
        OR (
          bs.email IS NOT NULL
          AND lower(bs.email) = lower(auth.jwt() ->> 'email')
        )
      )
  );
$function$;

ALTER POLICY "Users can view shares on accessible boards" ON public.board_shares
USING (
  user_id = auth.uid()
  OR is_board_owner(auth.uid(), board_id)
  OR EXISTS (
    SELECT 1
    FROM public.board_shares bs
    WHERE bs.board_id = board_shares.board_id
      AND (
        bs.user_id = auth.uid()
        OR (bs.email IS NOT NULL AND lower(bs.email) = lower(auth.jwt() ->> 'email'))
      )
  )
);

ALTER POLICY "Users can update own share" ON public.board_shares
USING (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
);

ALTER POLICY "Users can create posts on accessible boards" ON public.posts
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1
      FROM public.boards b
      WHERE b.id = posts.board_id
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.board_shares bs
      WHERE bs.board_id = posts.board_id
        AND bs.permission = ANY (ARRAY['write'::text, 'admin'::text])
        AND (
          bs.user_id = auth.uid()
          OR (bs.email IS NOT NULL AND lower(bs.email) = lower(auth.jwt() ->> 'email'))
        )
    )
  )
);