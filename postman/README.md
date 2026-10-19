# EduAdmin Postman collection

## Files

| File | Purpose |
| --- | --- |
| `EduAdmin_API_Testing.postman_collection.json` | Importable Postman Collection v2.1 |
| `EduAdmin_Local.postman_environment.json` | Local environment template |

## Import (Postman desktop or web)

1. Open Postman → **Import**.
2. Select both JSON files from this folder.
3. Choose the **EduAdmin Local** environment.
4. Set secret values (do not commit them):
   - `adminPassword` — local demo administrator password from the project README
   - `studentPassword` — local demo student password from the project README
5. Ensure MySQL is seeded and the API is running (`npm run db:up`, `npm run db:seed`, `npm run dev:api`).
6. Run the **Authentication → Login (admin)** request first so `token` is saved.
7. Run folders in order: Health → Authentication → Dashboard → Students → Courses → Enrollments → Learning Progress → Reports → Negative tests.

## Newman (CLI)

From the repository root, with the API listening on port 4000:

```bash
npx newman run postman/EduAdmin_API_Testing.postman_collection.json \
  -e postman/EduAdmin_Local.postman_environment.json \
  --env-var "adminPassword=<local-demo-password>" \
  --env-var "studentPassword=<local-demo-password>" \
  --delay-request 100
```

Passwords are supplied on the command line so they are not stored in the committed environment file.

## Notes

- Base URL defaults to `http://127.0.0.1:4000`.
- Protected routes use Bearer `{{token}}` from the login request.
- Mutation helpers create isolated QA courses where possible; prefer soft-unpublish over deleting seed data.
- Enrollment create may return `201` or `409` depending on existing rows.
- CSV export returns `text/csv`, not JSON.
