import { loadEnv, build } from 'vite';
import { validateNativeEnvironment } from './native-config.mjs';
const env = { ...loadEnv('native', process.cwd(), ''), ...process.env };
const errors = validateNativeEnvironment(env);
if (errors.length) {
  console.error('Android build needs backend configuration:\n' + errors.join('\n'));
  process.exit(1);
}
await build({ mode: 'native' });
