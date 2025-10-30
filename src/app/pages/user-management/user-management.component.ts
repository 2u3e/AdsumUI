import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

// User Interface
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdDate: string;
  department: string;
}

@Component({
  selector: "app-user-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./user-management.component.html",
  styleUrl: "./user-management.component.scss",
})
export class UserManagementComponent {
  // Filters
  searchTerm = signal("");
  selectedRole = signal("");
  selectedStatus = signal("");

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Dummy users data
  users = signal<User[]>([
    {
      id: 1,
      name: "Ahmet Yılmaz",
      email: "ahmet@example.com",
      role: "Admin",
      status: "active",
      createdDate: "2024-01-15",
      department: "Yönetim",
    },
    {
      id: 2,
      name: "Ayşe Demir",
      email: "ayse@example.com",
      role: "User",
      status: "active",
      createdDate: "2024-02-20",
      department: "İnsan Kaynakları",
    },
    {
      id: 3,
      name: "Mehmet Kaya",
      email: "mehmet@example.com",
      role: "Manager",
      status: "active",
      createdDate: "2024-03-10",
      department: "Satış",
    },
    {
      id: 4,
      name: "Fatma Şahin",
      email: "fatma@example.com",
      role: "User",
      status: "inactive",
      createdDate: "2024-01-25",
      department: "Muhasebe",
    },
    {
      id: 5,
      name: "Ali Çelik",
      email: "ali@example.com",
      role: "Admin",
      status: "active",
      createdDate: "2024-02-15",
      department: "Yönetim",
    },
    {
      id: 6,
      name: "Zeynep Arslan",
      email: "zeynep@example.com",
      role: "User",
      status: "active",
      createdDate: "2024-03-05",
      department: "Teknoloji",
    },
    {
      id: 7,
      name: "Mustafa Öztürk",
      email: "mustafa@example.com",
      role: "Manager",
      status: "active",
      createdDate: "2024-01-30",
      department: "Pazarlama",
    },
    {
      id: 8,
      name: "Emine Yıldız",
      email: "emine@example.com",
      role: "User",
      status: "inactive",
      createdDate: "2024-02-10",
      department: "İnsan Kaynakları",
    },
    {
      id: 9,
      name: "Hasan Koç",
      email: "hasan@example.com",
      role: "User",
      status: "active",
      createdDate: "2024-03-15",
      department: "Teknoloji",
    },
    {
      id: 10,
      name: "Merve Aydın",
      email: "merve@example.com",
      role: "Admin",
      status: "active",
      createdDate: "2024-01-20",
      department: "Yönetim",
    },
  ]);

  // Methods
  onAddUser() {
    console.log("Yeni kullanıcı ekle");
  }

  onViewUser(user: User) {
    console.log("Kullanıcı görüntüle:", user);
  }

  onEditUser(user: User) {
    console.log("Kullanıcı düzenle:", user);
  }

  onDeleteUser(user: User) {
    console.log("Kullanıcı sil:", user);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    console.log("Sayfa değişti:", page);
  }

  // Get role badge class
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case "Admin":
        return "kt-badge-destructive";
      case "Manager":
        return "kt-badge-warning";
      case "User":
        return "kt-badge-primary";
      default:
        return "kt-badge-secondary";
    }
  }
}
