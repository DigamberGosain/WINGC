import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wingc.lakeview',
  appName: 'Wing-C Lakeview',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
