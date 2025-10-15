import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth/auth.service";

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  iconBg: string;
  trend: "up" | "down";
}

interface Activity {
  id: number;
  type: "info" | "success" | "warning" | "danger";
  title: string;
  description: string;
  time: string;
  icon: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
}

@Component({
  selector: "app-index",
  imports: [CommonModule],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.scss",
})
export class IndexComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  currentTime = signal(new Date());

  // İstatistik Kartları
  statCards: StatCard[] = [
    {
      title: "Toplam Kullanıcılar",
      value: "2,847",
      change: 12.5,
      changeLabel: "Son 30 gün",
      icon: "user",
      iconBg: "bg-primary-light",
      trend: "up",
    },
    {
      title: "Aktif Projeler",
      value: "145",
      change: 8.2,
      changeLabel: "Son hafta",
      icon: "rocket",
      iconBg: "bg-success-light",
      trend: "up",
    },
    {
      title: "Bekleyen İşler",
      value: "23",
      change: -5.4,
      changeLabel: "Son hafta",
      icon: "timer",
      iconBg: "bg-warning-light",
      trend: "down",
    },
    {
      title: "Tamamlanan",
      value: "892",
      change: 15.8,
      changeLabel: "Bu ay",
      icon: "check-circle",
      iconBg: "bg-info-light",
      trend: "up",
    },
  ];

  // Son Aktiviteler
  recentActivities: Activity[] = [
    {
      id: 1,
      type: "success",
      title: "Yeni proje oluşturuldu",
      description: "Malatya Park Projesi başlatıldı",
      time: "5 dakika önce",
      icon: "check-circle",
    },
    {
      id: 2,
      type: "info",
      title: "Kullanıcı kaydı",
      description: "Ahmet Yılmaz sisteme katıldı",
      time: "1 saat önce",
      icon: "user-plus",
    },
    {
      id: 3,
      type: "warning",
      title: "Onay bekliyor",
      description: "3 belge onayınızı bekliyor",
      time: "3 saat önce",
      icon: "alert-circle",
    },
    {
      id: 4,
      type: "danger",
      title: "Sistem uyarısı",
      description: "Disk alanı %80 doldu",
      time: "5 saat önce",
      icon: "alert-triangle",
    },
    {
      id: 5,
      type: "success",
      title: "Görev tamamlandı",
      description: "Rapor hazırlama işlemi bitti",
      time: "Dün",
      icon: "check",
    },
  ];

  // Hızlı Aksiyonlar
  quickActions: QuickAction[] = [
    {
      title: "Yeni Proje",
      description: "Yeni bir proje oluştur",
      icon: "plus-circle",
      color: "primary",
    },
    {
      title: "Raporlar",
      description: "Detaylı raporları görüntüle",
      icon: "chart-line",
      color: "success",
    },
    {
      title: "Kullanıcılar",
      description: "Kullanıcıları yönet",
      icon: "users",
      color: "info",
    },
    {
      title: "Ayarlar",
      description: "Sistem ayarlarını düzenle",
      icon: "setting-2",
      color: "warning",
    },
  ];

  ngOnInit(): void {
    // Saati güncelle
    setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  }

  getActivityIcon(activity: Activity): string {
    return activity.icon;
  }

  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      info: "text-info",
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
    };
    return colors[type] || "text-gray-500";
  }

  getActivityBgColor(type: string): string {
    const colors: Record<string, string> = {
      info: "bg-info-light",
      success: "bg-success-light",
      warning: "bg-warning-light",
      danger: "bg-danger-light",
    };
    return colors[type] || "bg-gray-100";
  }
}
