import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bloodlink.app',
  appName: 'BloodLink',
  webDir: 'public',
  server: {
    url: 'http://10.62.127.58:3000',
    cleartext: true,
  },
};

export default config;
