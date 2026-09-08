# Email OTP setup

The account page uses Supabase signInWithOtp and verifyOtp (type email).
Production custom SMTP is enabled in the hosted project's Authentication > Emails
settings. Credentials remain encrypted in Supabase and must never be committed.
The email-otp.html body and the "Your STYVEX verification code" subject are applied
to both Confirm sign up and Magic link or OTP templates.

Site URL is set to https://styvex.vercel.app/account so verification returns to
the shared login and role routing page. https://styvex.vercel.app/** and the
existing Lovable URLs are in the redirect allow-list.

Hosted email templates and SMTP are Auth configuration, not database migrations.
After changing the provider or templates, verify delivery and code redemption in
production before declaring the authentication flow healthy.

The verified-owner trigger grants the configured owner email admin access only
after Auth confirms email ownership. Signup metadata never controls roles.
