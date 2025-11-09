# Toast Notification Sistemi - Hızlı Başlangıç

## 🚀 5 Dakikada Kullanıma Başlayın

### 1. Servisi Component'e Ekleyin

```typescript
import { NotificationService } from '@core/services/notification.service';

export class MyComponent {
  private notificationService = inject(NotificationService);
}
```

### 2. Mesaj Gösterin

```typescript
// Başarı
this.notificationService.success('İşlem başarılı!');

// Hata
this.notificationService.error('Bir hata oluştu!');

// Uyarı
this.notificationService.warning('Dikkat!');

// Bilgi
this.notificationService.info('Bilgilendirme');
```

### 3. Başlık Ekleyin

```typescript
this.notificationService.success(
  'Kayıt başarıyla oluşturuldu',
  'İşlem Başarılı'
);
```

### 4. Özel Ayarlar

```typescript
this.notificationService.success('Mesaj', 'Başlık', {
  duration: 10000,  // 10 saniye göster
  position: NotificationPosition.TopCenter,
  showProgressBar: true
});
```

## 🎯 API Entegrasyonu

### Otomatik Hata Gösterimi (Önerilen)

API hatalarını **otomatik olarak** yakalar ve gösterir:

```typescript
this.myService.getData().subscribe({
  next: (response) => {
    // Başarılı mesaj göster
    this.notificationService.success('Veri yüklendi');
  }
  // error: Hata otomatik gösterilir!
});
```

### CRUD İşlemleri

```typescript
// CREATE
createItem(data: any) {
  this.service.create(data).subscribe({
    next: () => {
      this.notificationService.success('Kayıt oluşturuldu');
      this.loadItems();
    }
  });
}

// UPDATE
updateItem(id: string, data: any) {
  this.service.update(id, data).subscribe({
    next: () => {
      this.notificationService.success('Kayıt güncellendi');
      this.loadItems();
    }
  });
}

// DELETE
deleteItem(id: string) {
  this.service.delete(id).subscribe({
    next: () => {
      this.notificationService.success('Kayıt silindi');
      this.loadItems();
    }
  });
}
```

## 📍 Pozisyonlar

```typescript
import { NotificationPosition } from '@core/models/notification.models';

NotificationPosition.TopRight      // ✅ Varsayılan
NotificationPosition.TopLeft
NotificationPosition.TopCenter
NotificationPosition.BottomRight
NotificationPosition.BottomLeft
NotificationPosition.BottomCenter
```

## ⚙️ Konfigürasyon Seçenekleri

| Seçenek | Tip | Varsayılan | Açıklama |
|---------|-----|------------|----------|
| `duration` | number | 5000 | Gösterim süresi (ms) |
| `position` | NotificationPosition | TopRight | Ekrandaki pozisyon |
| `animation` | NotificationAnimation | Slide | Animasyon türü |
| `showCloseButton` | boolean | true | Kapatma butonu |
| `showProgressBar` | boolean | true | İlerleme çubuğu |
| `closeOnClick` | boolean | false | Tıklayınca kapat |
| `pauseOnHover` | boolean | true | Hover'da duraklat |
| `showIcon` | boolean | true | İkon göster |

## 🎨 Metronic Tasarım

Sistem otomatik olarak Metronic alert stillerini kullanır:
- ✅ Success (Yeşil)
- ❌ Error (Kırmızı)
- ⚠️ Warning (Sarı)
- ℹ️ Info (Mavi)
- 🔵 Primary (Primary renk)

## 💡 İpuçları

1. **Hata mesajlarını otomatik sisteme bırakın** - HTTP interceptor halleder
2. **Başarı mesajlarını açıkça gösterin** - Kullanıcı işlemin tamamlandığını bilmeli
3. **Uzun mesajlar için süreyi artırın** - `duration: 7000` veya daha fazla
4. **Kritik işlemlerde kapatma butonunu gösterin** - Kullanıcı kontrolü

## 🔧 Sorun Giderme

**Toast'lar görünmüyor?**
- `app.component.html`'de `<app-toast-container>` var mı kontrol edin
- Browser console'da hata var mı bakın

**Otomatik hata gösterimi çalışmıyor?**
- `app.config.ts`'de `errorHandlerInterceptor` ekli mi kontrol edin

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için: [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
