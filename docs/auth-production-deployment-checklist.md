# Auth Production Deployment Checklist

Use this checklist before deploying authentication and ownership changes to the VPS.

## Required migration order

Apply all existing migrations in order. The auth deployment specifically depends on:

1. `apps/backend/migrations/006_add_auth_tables.sql`
2. `apps/backend/migrations/007_add_user_ownership.sql`

Do not deploy backend auth changes unless both migrations have been applied successfully.

## Deployment rule

Deploy frontend and backend auth changes together.

Do not deploy the backend auth changes alone. The authenticated API requires the frontend
auth gate and OTP flow to be deployed at the same time.

## Pre-deployment backup

Run a production backup before deployment.

Confirm the backup artifact exists and is restorable before changing production services.

## Post-deployment checks

Verify the API health endpoint:

```bash
curl http://94.130.75.66/api/health
```

Then browser-test OTP login on the VPS:

1. Open the production frontend.
2. Request an OTP.
3. Verify the OTP delivery path for production.
4. Complete login.
5. Confirm the dashboard loads only the authenticated user's applications.
6. Confirm logout returns to the auth gate.
