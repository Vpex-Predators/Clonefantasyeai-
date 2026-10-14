export function validateNativeEnvironment(env) {
  const errors = [];
  if (!/^[a-f\d]{24}$/i.test(env.VITE_BASE44_APP_ID || '')) errors.push('Set VITE_BASE44_APP_ID to the verified development app ID.');
  for (const key of ['VITE_BASE44_APP_BASE_URL', 'VITE_BASE44_API_URL']) {
    try {
      const url = new URL(env[key]);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
      if (['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error();
    } catch { errors.push(`${key} must be a verified HTTPS origin without credentials or a path.`); }
  }
  return errors;
}
