import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blecks.app', // Defini um ID padrão pra você não travar nisso
  appName: 'Blecks',
  webDir: 'public', // Usamos 'public' pq ela sempre existe no Next.js, evita erros
  server: {
    androidScheme: 'https',
    // IMPORTANTE: Coloque a URL real do seu projeto abaixo
    url: 'https://www.blacksproductivity.site', 
    cleartext: true
  }
};

export default config;