UPDATE auth.users
SET encrypted_password = crypt('Home2020$$', gen_salt('bf')),
    updated_at = now()
WHERE email = 'eduardobraoli@gmail.com';