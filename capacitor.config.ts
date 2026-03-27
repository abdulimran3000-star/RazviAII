import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deenai.app',
  appName: 'DeenAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
