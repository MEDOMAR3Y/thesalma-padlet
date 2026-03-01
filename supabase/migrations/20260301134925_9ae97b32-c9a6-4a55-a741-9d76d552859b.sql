
-- 1. Fix: Attach the trigger for new user profiles (it exists as function but trigger is missing)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix infinite recursion: Drop problematic boards SELECT policy
DROP POLICY IF EXISTS "Users can view own or shared boards" ON public.boards;

-- 3. Recreate boards SELECT policy WITHOUT inline board_shares subquery
CREATE POLICY "Users can view own or shared boards"
  ON public.boards FOR SELECT
  USING (
    auth.uid() = user_id
    OR visibility = 'public'
    OR public.user_has_board_access(auth.uid(), id)
  );

-- 4. Fix board_shares policies to avoid recursion (use security definer for owner check)
DROP POLICY IF EXISTS "Board owner can manage shares" ON public.board_shares;
DROP POLICY IF EXISTS "Users can view their shares" ON public.board_shares;

-- Create a helper function to check board ownership without triggering boards RLS
CREATE OR REPLACE FUNCTION public.is_board_owner(_user_id uuid, _board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM boards
    WHERE id = _board_id AND user_id = _user_id
  );
$$;

-- Recreate board_shares policies using the security definer function
CREATE POLICY "Board owner can manage shares"
  ON public.board_shares FOR ALL
  USING (public.is_board_owner(auth.uid(), board_id));

CREATE POLICY "Users can view their shares"
  ON public.board_shares FOR SELECT
  USING (user_id = auth.uid());

-- 5. Delete all existing profiles (will be recreated on signup)
DELETE FROM public.profiles;
