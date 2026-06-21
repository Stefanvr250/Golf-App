-- Persist registration consent timestamp in profiles for POPIA compliance.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, accepted_terms_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'player',
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'accepted_terms_at', '')::timestamptz, now())
  );
  RETURN NEW;
END;
$$;

UPDATE public.profiles p
SET accepted_terms_at = COALESCE(NULLIF(u.raw_user_meta_data ->> 'accepted_terms_at', '')::timestamptz, p.created_at)
FROM auth.users u
WHERE p.id = u.id
  AND p.accepted_terms_at IS NULL;
