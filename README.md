# Denota App
Frontend for Denota

production url: app.denota.xyz

## Server environment

Set these in `.env.local` (and Vercel) for pay-to-email/phone:

- `NEXT_PUBLIC_PRIVY_APP_ID` — already used for client login
- `PRIVY_APP_SECRET` — server-only; used to look up or create Privy users
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — SMS after a successful payment
- `NEXT_PUBLIC_APP_URL` — optional login URL in SMS (defaults to https://app.denota.xyz)
