/// <reference types="vite/client" />
import { Capacitor } from '@capacitor/core';
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  // Bundled Android assets run on localhost; API calls must use the hosted origin.
  serverUrl: Capacitor.isNativePlatform() ? import.meta.env.VITE_BASE44_API_URL : '',
  appBaseUrl
});
