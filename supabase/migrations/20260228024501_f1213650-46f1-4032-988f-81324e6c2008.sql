
-- Add 'blocked' to the permission check constraint
ALTER TABLE public.board_shares DROP CONSTRAINT IF EXISTS board_shares_permission_check;
ALTER TABLE public.board_shares ADD CONSTRAINT board_shares_permission_check CHECK (permission IN ('read', 'write', 'admin', 'blocked'));

-- Update boards SELECT to exclude blocked users
DROP POLICY IF EXISTS "Users can view own or shared boards" ON public.boards;
CREATE POLICY "Users can view own or shared boards" ON public.boards
FOR SELECT USING (
  auth.uid() = user_id 
  OR visibility = 'public'
  OR (public.user_has_board_access(auth.uid(), id) AND NOT EXISTS (
    SELECT 1 FROM board_shares WHERE board_shares.board_id = boards.id AND board_shares.user_id = auth.uid() AND board_shares.permission = 'blocked'
  ))
);

-- Update the security definer function to exclude blocked
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
    AND board_shares.permission != 'blocked'
  );
$$;
