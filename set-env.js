const fs = require('fs');
const dotenv = require('dotenv');

// .env dosyasını oku
const envConfig = dotenv.config().parsed || {};

// Varsayılan değerler
const environment = {
  API_URL: envConfig.API_URL || 'https://localhost:7196',
  APP_NAME: envConfig.APP_NAME || 'ADSUM',
  APP_VERSION: envConfig.APP_VERSION || '1.0.0'
};

// Environment dosyasını güncelle
const envFile = `export const environment = {
  production: false,
  apiUrl: '${environment.API_URL}',
  appName: '${environment.APP_NAME}',
  version: '${environment.APP_VERSION}'
};
`;

fs.writeFileSync('./src/environments/environment.ts', envFile);
console.log('✅ Environment variables loaded from .env');
console.log(`   API_URL: ${environment.API_URL}`);
