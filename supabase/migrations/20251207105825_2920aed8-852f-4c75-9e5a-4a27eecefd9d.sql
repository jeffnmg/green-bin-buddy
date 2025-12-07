-- Drop and recreate the trigger function to handle null phone numbers properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  phone_val TEXT;
BEGIN
  -- Get phone number, treating empty string as NULL
  phone_val := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'phone_number', '')), '');
  
  INSERT INTO public.users (auth_user_id, username, email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    phone_val
  );
  RETURN NEW;
END;
$$;