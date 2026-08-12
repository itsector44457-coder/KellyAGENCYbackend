// dns-setup.js - This MUST be the first import in server.js
// ESM imports are hoisted, but side-effects of this module run first
import { setServers } from 'dns';

try {
  setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  console.log('✅ [DNS] Forced Google/Cloudflare public DNS for MongoDB Atlas SRV resolution');
} catch (e) {
  console.warn('⚠️ [DNS] Could not set custom DNS servers:', e.message);
}
