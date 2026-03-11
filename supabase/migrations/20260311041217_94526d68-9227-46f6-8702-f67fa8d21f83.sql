
-- Update handle_new_user to also save username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username text;
  _display_name text;
BEGIN
  _username := NEW.raw_user_meta_data->>'username';
  _display_name := COALESCE(_username, split_part(NEW.email, '@', 1));
  
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (NEW.id, _display_name, _username)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
