export function requirePublicEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Set it in frontend/.env.local for local dev (copy from frontend/.env.example), ` +
        `or configure it as an environment variable in your deployment (Railway Variables).`
    );
  }
  return value;
}
