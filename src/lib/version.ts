export function appVersion(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_VERSION || "local";
}

export function hasNewVersion(current: string, remote: string | null | undefined): boolean {
  if (!remote || !current) return false;
  if (current === "local" || remote === "local") return false;
  return current !== remote;
}
