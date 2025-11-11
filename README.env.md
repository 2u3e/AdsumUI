# Environment Yapılandırması

## Kurulum

1. `.env.example` dosyasını `.env` olarak kopyalayın:
   ```bash
   copy .env.example .env
   ```

2. `.env` dosyasını düzenleyin ve kendi backend URL'inizi girin:
   ```env
   API_URL=https://localhost:KENDI_PORT_NUMARANIZ
   ```

## Önemli Notlar

- `.env` dosyası git'e eklenmez (`.gitignore`'da)
- Her geliştirici kendi `.env` dosyasını oluşturmalı
- Production için `environment.prod.ts` dosyasını kullanın

## Değişkenler

- **API_URL**: Backend API'nin base URL'i
- **APP_NAME**: Uygulama adı
- **APP_VERSION**: Versiyon numarası
