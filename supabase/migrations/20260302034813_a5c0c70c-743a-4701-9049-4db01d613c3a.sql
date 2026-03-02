
-- Fix board_shares RLS: allow users to view shares on boards they can access
DROP POLICY IF EXISTS "Users can view their shares" ON board_shares;
CREATE POLICY "Users can view shares on accessible boards" ON board_shares
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_board_owner(auth.uid(), board_id)
    OR EXISTS (
      SELECT 1 FROM board_shares bs 
      WHERE bs.board_id = board_shares.board_id 
      AND bs.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert board_shares when they have a valid token
-- (for self-association via token)
DROP POLICY IF EXISTS "Board owner can manage shares" ON board_shares;
CREATE POLICY "Board owner can manage shares" ON board_shares
  FOR ALL TO authenticated
  USING (is_board_owner(auth.uid(), board_id))
  WITH CHECK (is_board_owner(auth.uid(), board_id));

-- Allow users to update their own share (for token association)
CREATE POLICY "Users can update own share" ON board_shares
  FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- Allow users to insert share for themselves (token-based)
CREATE POLICY "Users can self-associate via token" ON board_shares
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
