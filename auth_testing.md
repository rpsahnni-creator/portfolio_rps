# Auth Testing Playbook — rpsahnni.dev

Step 1: PostgreSQL Verification
```
psql -U postgres -d rps_portfolio
SELECT email, role, password_hash FROM users WHERE role='admin';
```
Verify: bcrypt hash starts with `$2b$`; `users.email` and `login_attempts.identifier` are primary keys (unique by construction).

Step 2: API Testing
```
curl -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}'
cat cookies.txt
curl -b cookies.txt $API/api/auth/me
```
Login returns {"token", "user"} and sets access_token cookie. /me returns admin user.

Step 3: Admin CRUD
```
TOKEN=$(curl -s -X POST $API/api/auth/login ... | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s $API/api/admin/projects -H "Authorization: Bearer $TOKEN"
```
Unauthenticated admin calls must return 401.
