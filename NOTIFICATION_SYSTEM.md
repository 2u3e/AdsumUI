# Toast Notification Sistemi - Kullanım Kılavuzu

## Genel Bakış

Bu proje, Metronic tasarım sistemine uygun, profesyonel ve evrensel bir toast notification sistemi içermektedir. Sistem, API'den gelen hataları, başarı mesajlarını ve diğer bildirimleri otomatik olarak kullanıcıya gösterir.

## Özellikler

- ✅ **Otomatik Hata Yakalama**: HTTP interceptor ile API hatalarını otomatik yakalar
- ✅ **Response & ProblemDetails Desteği**: ASP.NET Core standart response formatlarını destekler
- ✅ **Metronic Tasarım**: Metronic alert bileşenlerine tam uyumlu
- ✅ **5 Farklı Tip**: Success, Error, Warning, Info, Primary
- ✅ **6 Pozisyon Seçeneği**: Top/Bottom + Left/Right/Center
- ✅ **4 Animasyon Türü**: Fade, Slide, Bounce, Zoom
- ✅ **Progress Bar**: Otomatik kapanma süresini gösteren progress bar
- ✅ **Özelleştirilebilir**: Her notification için farklı ayarlar
- ✅ **Responsive**: Mobil uyumlu tasarım

## Dosya Yapısı

```
src/app/
├── core/
│   ├── models/
│   │   ├── notification.models.ts     # Notification tipleri ve modelleri
│   │   └── api.models.ts              # Response ve ErrorDetail modelleri
│   ├── services/
│   │   └── notification.service.ts    # Notification yönetim servisi
│   └── interceptors/
│       └── error-handler.interceptor.ts # Otomatik hata yakalama
└── shared/
    └── components/
        └── toast-container/           # Toast görsel bileşeni
            ├── toast-container.component.ts
            ├── toast-container.component.html
            └── toast-container.component.scss
```

## Kurulum

Sistem zaten global olarak yapılandırılmıştır:

1. **app.config.ts** - HTTP interceptor eklenmiş
2. **app.component.html** - Toast container eklenmiş
3. Otomatik olarak çalışır, ekstra kurulum gerekmez

## Temel Kullanım

### 1. Servis Injection

```typescript
import { Component, inject } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';

@Component({...})
export class MyComponent {
  private notificationService = inject(NotificationService);
}
```

### 2. Basit Mesajlar

```typescript
// Başarı mesajı
this.notificationService.success('İşlem başarıyla tamamlandı!');

// Hata mesajı
this.notificationService.error('Bir hata oluştu!');

// Uyarı mesajı
this.notificationService.warning('Dikkat! Bu işlem geri alınamaz.');

// Bilgi mesajı
this.notificationService.info('Yeni güncelleme mevcut.');

// Primary mesaj
this.notificationService.primary('Hoş geldiniz!');
```

### 3. Başlık ile Mesajlar

```typescript
this.notificationService.success(
  'Vatandaş başarıyla kaydedildi.',
  'Başarılı İşlem'
);

this.notificationService.error(
  'E-posta adresi zaten kullanımda.',
  'Validasyon Hatası'
);
```

### 4. Özel Konfigürasyon

```typescript
this.notificationService.success(
  'İşlem tamamlandı!',
  'Başarılı',
  {
    duration: 10000,              // 10 saniye göster
    position: NotificationPosition.TopCenter,
    animation: NotificationAnimation.Bounce,
    showProgressBar: true,
    showCloseButton: true,
    pauseOnHover: true,
  }
);
```

## API Response Entegrasyonu

### Otomatik Hata Gösterimi

API'den gelen hatalar **otomatik olarak** gösterilir. Hiçbir şey yapmanıza gerek yok!

```typescript
// API çağrısı yap - hatalar otomatik gösterilir
this.citizenService.create(citizen).subscribe({
  next: (response) => {
    // Başarılı işlem
  },
  error: (error) => {
    // Hata zaten gösterildi, ek işlem yapmaya gerek yok
  }
});
```

### Manuel API Response İşleme

İsterseniz manuel olarak da işleyebilirsiniz:

```typescript
this.citizenService.getById(id).subscribe({
  next: (response) => {
    this.notificationService.fromApiResponse(response);
  }
});
```

### Error Details İşleme

```typescript
if (response.errors && response.errors.length > 0) {
  this.notificationService.fromErrorDetails(response.errors);
}
```

### ProblemDetails İşleme

```typescript
// ASP.NET Core ProblemDetails formatındaki hataları işle
this.notificationService.fromProblemDetails(problemDetails);
```

## HTTP Error İşleme

### Otomatik İşleme (Önerilen)

Error handler interceptor tüm hataları otomatik yakalar. Hiçbir şey yapmanıza gerek yok!

### Bildirimleri Devre Dışı Bırakma

Bazı isteklerde otomatik bildirim göstermek istemezseniz:

**Query Parameter ile:**
```typescript
this.http.get('/api/endpoint?silent=true');
```

**Header ile:**
```typescript
this.http.get('/api/endpoint', {
  headers: { 'X-Skip-Notification': 'true' }
});
```

## Gelişmiş Özellikler

### Notification Kapatma

```typescript
// Bir notification göster ve ID'sini al
const notificationId = this.notificationService.success('Mesaj');

// Daha sonra kapat
this.notificationService.close(notificationId);

// Tüm notification'ları kapat
this.notificationService.closeAll();
```

### Pozisyon Seçenekleri

```typescript
import { NotificationPosition } from '@core/models/notification.models';

// Farklı pozisyonlar
NotificationPosition.TopRight      // Sağ üst (varsayılan)
NotificationPosition.TopLeft       // Sol üst
NotificationPosition.TopCenter     // Orta üst
NotificationPosition.BottomRight   // Sağ alt
NotificationPosition.BottomLeft    // Sol alt
NotificationPosition.BottomCenter  // Orta alt
```

### Animasyon Türleri

```typescript
import { NotificationAnimation } from '@core/models/notification.models';

NotificationAnimation.Slide   // Yan kayma (varsayılan)
NotificationAnimation.Fade    // Belirme/kaybolma
NotificationAnimation.Bounce  // Zıplama efekti
NotificationAnimation.Zoom    // Yakınlaşma/uzaklaşma
```

### Özel Stil Ekleme

```typescript
this.notificationService.success('Mesaj', 'Başlık', {
  customClass: 'my-custom-notification'
});
```

## Konfigürasyon Referansı

```typescript
interface NotificationConfig {
  /** Otomatik kapanma süresi (ms). 0 = otomatik kapanmaz */
  duration?: number;           // Varsayılan: 5000

  /** Pozisyon */
  position?: NotificationPosition;  // Varsayılan: TopRight

  /** Animasyon türü */
  animation?: NotificationAnimation; // Varsayılan: Slide

  /** Kapatma butonu göster */
  showCloseButton?: boolean;   // Varsayılan: true

  /** Progress bar göster */
  showProgressBar?: boolean;   // Varsayılan: true

  /** Tıklanınca kapansın */
  closeOnClick?: boolean;      // Varsayılan: false

  /** Hover'da durakla */
  pauseOnHover?: boolean;      // Varsayılan: true

  /** Icon göster */
  showIcon?: boolean;          // Varsayılan: true

  /** Özel CSS class */
  customClass?: string;        // Varsayılan: ''

  /** En yeni en üstte */
  newestOnTop?: boolean;       // Varsayılan: true
}
```

## Gerçek Dünya Örnekleri

### Örnek 1: Form Kaydetme

```typescript
saveForm() {
  this.organizationService.create(this.form.value).subscribe({
    next: (response) => {
      // Hata varsa otomatik gösterilir
      // Başarılı mesaj göster
      this.notificationService.success(
        'Organizasyon başarıyla oluşturuldu',
        'İşlem Başarılı'
      );
      this.router.navigate(['/organizations']);
    },
    error: (error) => {
      // Hata zaten otomatik gösterildi
      // Ek işlem gerekirse buraya yazabilirsiniz
    }
  });
}
```

### Örnek 2: Toplu İşlem

```typescript
async processBulkOperation(items: any[]) {
  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    try {
      await this.process(item);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }

  if (successCount > 0) {
    this.notificationService.success(
      `${successCount} kayıt başarıyla işlendi`,
      'Toplu İşlem',
      { duration: 7000 }
    );
  }

  if (errorCount > 0) {
    this.notificationService.error(
      `${errorCount} kayıt işlenemedi`,
      'Toplu İşlem',
      { duration: 7000 }
    );
  }
}
```

### Örnek 3: Kullanıcı Onayı Gerekli İşlem

```typescript
deleteItem(id: string) {
  if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
    this.itemService.delete(id).subscribe({
      next: () => {
        this.notificationService.success(
          'Kayıt başarıyla silindi',
          'Silme İşlemi'
        );
        this.loadItems();
      }
      // Hata otomatik gösterilir
    });
  }
}
```

### Örnek 4: Özel Error Handling

```typescript
login(credentials: LoginRequest) {
  this.authService.login(credentials).subscribe({
    next: (response) => {
      this.notificationService.success(
        'Hoş geldiniz!',
        undefined,
        { 
          position: NotificationPosition.TopCenter,
          animation: NotificationAnimation.Bounce 
        }
      );
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      // Özel hata mesajı göster
      if (error.status === 401) {
        this.notificationService.error(
          'Kullanıcı adı veya şifre hatalı',
          'Giriş Başarısız',
          { duration: 7000 }
        );
      }
      // Diğer hatalar otomatik gösterilir
    }
  });
}
```

## Stil Özelleştirme

Toast container, Metronic'in mevcut alert stillerini kullanır. Özel stil eklemek için:

```scss
// your-component.scss
.my-custom-notification {
  border-left: 4px solid #00ff00;
  background: linear-gradient(to right, #f0f0f0, #ffffff);
}
```

## Metronic Alert Sınıfları

Sistem otomatik olarak şu Metronic sınıflarını kullanır:

- `.kt-alert-success` - Başarı mesajları
- `.kt-alert-destructive` - Hata mesajları
- `.kt-alert-warning` - Uyarı mesajları
- `.kt-alert-info` - Bilgi mesajları
- `.kt-alert-primary` - Primary mesajlar

## İkonlar

Sistem Metronic'in Keen Icons setini kullanır:

- Success: `ki-check-circle`
- Error: `ki-cross-circle`
- Warning: `ki-information-circle`
- Info: `ki-information-circle`
- Primary: `ki-abstract-26`

## Performans İpuçları

1. **Çok Fazla Notification Göstermeyin**: Kullanıcı deneyimini olumsuz etkiler
2. **Uygun Süre Kullanın**: Hata mesajları için 7000ms, başarı için 5000ms ideal
3. **Progress Bar**: Kullanıcıya ne kadar süre kalduğunu gösterir
4. **Pause on Hover**: Kullanıcı okurken zamanı durdurur

## Sorun Giderme

### Notification'lar Görünmüyor

1. `app.component.html`'de `<app-toast-container>` ekli mi?
2. `app.component.ts`'de import edilmiş mi?
3. Browser console'da hata var mı?

### Stillar Yanlış Görünüyor

1. Metronic CSS dosyaları yüklü mü? (`src/assets/vendors/ktui/styles.css`)
2. Keen Icons yüklü mü?
3. Tailwind CSS çalışıyor mu?

### Otomatik Hata Gösterimi Çalışmıyor

1. `app.config.ts`'de `errorHandlerInterceptor` ekli mi?
2. Interceptor sırası doğru mu? (auth önce, error handler sonra)
3. API response formatı `Response<T>` veya `ProblemDetails` mi?

## Best Practices

1. **Otomatik Sistemi Kullanın**: HTTP hatalar için otomatik sistem yeterlidir
2. **Başarı Mesajları Gösterin**: Kullanıcı işlemin tamamlandığını bilmeli
3. **Açıklayıcı Olun**: Mesajlar net ve anlaşılır olmalı
4. **Tutarlı Olun**: Uygulama genelinde aynı tür mesajlar için aynı stili kullanın
5. **Test Edin**: Farklı cihazlarda ve ekran boyutlarında test edin

## Örnekler

Örnek kullanımlar için şu dosyalara bakabilirsiniz:

- `src/app/pages/citizen/citizen.component.ts`
- `src/app/pages/organization/organization.component.ts`
- `src/app/core/services/base-http.service.ts`

---

**Not**: Bu sistem tüm uygulama genelinde kullanılmak üzere tasarlanmıştır. Tutarlılık için her yerde aynı servisi kullanın.
