Auth setup (Appwrite + JWT)

1. Add environment variables (example .env):

NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_server_api_key
AUTH_JWT_SECRET=replace_this_with_a_strong_secret
AUTH_JWT_EXPIRES_IN=7d

2. Install new dependency:

npm install

# then install jsonwebtoken
npm install jsonwebtoken @types/jsonwebtoken --save-dev

3. Create a user in Appwrite console (email + password) to use as admin.

4. Run the app and visit /admin/login to sign in.

Notes:
- The server-side login route creates an Appwrite session and then generates a JWT stored in an HttpOnly cookie `scum_auth`.
- Middleware validates the JWT locally for protected routes.
- Logout clears the cookie and attempts to delete Appwrite sessions.

Security:
- Use a strong `AUTH_JWT_SECRET` and keep it out of source control.
- Ensure production runs under HTTPS (Secure cookie flag will be set in production).
