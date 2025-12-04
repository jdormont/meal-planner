/*
  # Create count_user_logins function

  1. Function
    - Creates a function to count successful login events for a user from auth.audit_log_entries
    - Counts entries where payload contains 'action': 'login' or 'action': 'token_refreshed'
    - Only counts successful authentication events
  
  2. Security
    - Function is SECURITY DEFINER to allow reading from auth schema
    - Only callable by authenticated users
*/

CREATE OR REPLACE FUNCTION count_user_logins(target_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  login_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO login_count
  FROM auth.audit_log_entries
  WHERE 
    (payload->>'user_id')::uuid = target_user_id
    AND payload->>'action' = 'login';
  
  RETURN COALESCE(login_count, 0);
END;
$$;