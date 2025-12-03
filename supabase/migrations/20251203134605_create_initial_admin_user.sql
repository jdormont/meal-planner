/*
  # Create initial admin user

  1. Purpose
    - Creates the first admin user for the system
    - This user can then approve other signups and manage users

  2. Setup Instructions
    - After running this migration, sign up with ANY email/password
    - The FIRST user to sign up will automatically become an admin
    - Their status will be set to APPROVED
    - All subsequent users will be PENDING by default

  3. Implementation
    - Function checks if any admin exists
    - If no admin exists, makes the first user an admin
    - Updates trigger to use this logic
*/

-- Update the handle_new_user function to create first user as admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_exists boolean;
BEGIN
  -- Check if any admin user already exists
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE is_admin = true) INTO admin_exists;
  
  -- If no admin exists, make this user an admin and approve them
  IF NOT admin_exists THEN
    INSERT INTO public.user_profiles (user_id, full_name, status, is_admin)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
      'APPROVED',
      true
    );
  ELSE
    -- Otherwise, create as pending regular user
    INSERT INTO public.user_profiles (user_id, full_name, status, is_admin)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      'PENDING',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;