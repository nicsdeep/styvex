# Email OTP setup

The account page uses Supabase signInWithOtp and verifyOtp (type email).
Configure a custom SMTP sender in the hosted project's Authentication > Emails.
Use email-otp.html for both Confirm sign up and Magic link or OTP templates.
Site URL is set to https://styvex.vercel.app/account so verification returns to
the shared login and role routing page. Existing Lovable redirect URLs remain.

Hosted email templates are Auth configuration, not database migrations. The
template in this folder must be applied in the dashboard after SMTP is connected.
Until then, the default sender restricts recipients and sends sign-in links.
Do not claim OTP delivery is ready without a successful delivery and verification.

The verified-owner trigger grants the configured owner email admin access only
after Auth confirms email ownership. Signup metadata never controls roles.
