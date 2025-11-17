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

// Create Form Interface - Wizard Step 1: Temel Kimlik Bilgileri
interface CitizenInfo {
  identityNumber: string;
  name: string;
  lastName: string;
  birthDate: string | null;
  birthPlace: string;
}

// Wizard Step 2: Pozisyon ve Birim Bilgileri
interface EmployeePositionInfo {
  registrationNumber: string;
  organizationId: string | null;
  dutyId: string | null;
  titleId: string | null;
  startDate: string;
}

// Wizard Step 3: İletişim Bilgileri (merged with Position)
interface CommunicationInfo {
  workPhone: string;
  mobilePhone: string;
  workEmail: string;
  personalEmail: string;
}

// Wizard Step 4: Eğitim Bilgileri (Multiple, Optional)
interface EducationInfo {
  educationTypeId: string | null;
  universityId: string | null;
  departmentId: string | null;
  startDate: string;
  endDate: string | null;
}

// Profil Fotoğrafı (Part of Step 1)
interface ProfileImageInfo {
  imageFile: File | null;
  imagePreview: string | null;
  description: string;
}

// Kullanıcı Hesabı (Step 1)
interface UserAccountInfo {
  username: string;
  password: string;
  passwordConfirm: string;
  isActive: boolean;
}

// Complete Create Employee Form
interface CreateEmployeeForm {
  citizen: CitizenInfo;
  position: EmployeePositionInfo;
  communication: CommunicationInfo;
  education: EducationInfo[];
  profileImage: ProfileImageInfo;
  userAccount: UserAccountInfo;
}

// Edit Form Interface
interface EditUserForm {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
  organizationId: string | null;
  isActive: boolean;
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

  // Filter offcanvas state
  filterOffcanvasOpen = signal(false);

  // Modal states
  createModalOpen = signal(false);
  editModalOpen = signal(false);
  deleteModalOpen = signal(false);
  selectedUser = signal<User | null>(null);

  // Form submission states
  createFormSubmitting = signal(false);
  editFormSubmitting = signal(false);

  // Change password checkbox
  changePassword = signal(false);

  // Wizard current step (1-3)
  currentStep = signal(1);

  // Create Employee Wizard Form
  createEmployeeForm = {
    // Step 1: Kullanıcı Hesabı ve Profil
    userAccount: {
      username: signal(""),
      password: signal(""),
      passwordConfirm: signal(""),
      email: signal(""),
      isActive: signal(true),
    },
    profileImage: {
      imageFile: signal<File | null>(null),
      imagePreview: signal<string | null>(null),
    },
    // Step 1: Name/Surname added to user account
    name: signal(""),
    lastName: signal(""),
    // Step 2: Temel Kimlik Bilgileri + Birim Bilgileri (merged)
    citizen: {
      identityNumber: signal(""),
      birthDate: signal<string | null>(null),
      birthPlace: signal(""),
    },
    // Step 3: Pozisyon ve Birim Bilgileri (only if real person)
    position: {
      registrationNumber: signal(""),
      organizationId: signal<string | null>(null),
      dutyId: signal<string | null>(null),
      titleId: signal<string | null>(null),
      startDate: signal(""),
    },
    // Step 3: İletişim Bilgileri (merged with position, only if real person)
    communication: {
      workPhone: signal(""),
      mobilePhone: signal(""),
      workEmail: signal(""),
      personalEmail: signal(""),
    },
    // Step 4: Eğitim Bilgileri (optional, only if real person)
    education: signal<EducationInfo[]>([
      {
        educationTypeId: null,
        universityId: null,
        departmentId: null,
        startDate: "",
        endDate: null,
      },
    ]),
  };

  // Touched states for each step
  step1Touched = {
    username: signal(false),
    password: signal(false),
    passwordConfirm: signal(false),
    email: signal(false),
    name: signal(false),
    lastName: signal(false),
  };

  step2Touched = {
    identityNumber: signal(false),
    workPhone: signal(false),
    mobilePhone: signal(false),
    organizationId: signal(false),
    dutyId: signal(false),
    startDate: signal(false),
  };

  // Edit form
  editForm = {
    id: signal(0),
    firstName: signal(""),
    lastName: signal(""),
    email: signal(""),
    username: signal(""),
    password: signal(""),
    passwordConfirm: signal(""),
    organizationId: signal<string | null>(null),
    isActive: signal(true),
  };

  editFormTouched = {
    firstName: signal(false),
    lastName: signal(false),
    email: signal(false),
    username: signal(false),
    password: signal(false),
    passwordConfirm: signal(false),
  };

  // Methods
  onAddUser() {
    this.openCreateModal();
  }

  onEditUser(user: User) {
    this.selectedUser.set(user);
    // Parse name into first and last name
    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    this.editForm.id.set(user.id);
    this.editForm.firstName.set(firstName);
    this.editForm.lastName.set(lastName);
    this.editForm.email.set(user.email);
    this.editForm.username.set(user.email.split("@")[0]);
    this.editForm.password.set("");
    this.editForm.passwordConfirm.set("");
    this.editForm.organizationId.set(null);
    this.editForm.isActive.set(user.status === "active");
    this.changePassword.set(false);

    // Reset touched state
    this.editFormTouched.firstName.set(false);
    this.editFormTouched.lastName.set(false);
    this.editFormTouched.email.set(false);
    this.editFormTouched.username.set(false);
    this.editFormTouched.password.set(false);
    this.editFormTouched.passwordConfirm.set(false);

    this.editModalOpen.set(true);
  }

  onDeleteUser(user: User) {
    this.selectedUser.set(user);
    this.deleteModalOpen.set(true);
  }

  toggleUserStatus(user: User) {
    // Toggle status
    const newStatus = user.status === "active" ? "inactive" : "active";

    // Update user status in the list
    const updatedUsers = this.users().map((u) =>
      u.id === user.id ? { ...u, status: newStatus } : u,
    );
    this.users.set(updatedUsers);

    // Here you would typically make an API call to update the status
    console.log(`User ${user.name} status changed to: ${newStatus}`);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    console.log("Sayfa değişti:", page);
  }

  // Filter methods
  openFilterOffcanvas() {
    this.filterOffcanvasOpen.set(true);
  }

  clearAllFilters() {
    this.searchTerm.set("");
    this.selectedRole.set("");
    this.selectedStatus.set("");
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.selectedRole()) count++;
    if (this.selectedStatus()) count++;
    return count;
  }

  // Create Modal methods
  openCreateModal() {
    this.resetCreateEmployeeForm();
    this.currentStep.set(1);
    this.createModalOpen.set(true);
  }

  closeCreateModal() {
    this.createModalOpen.set(false);
    this.resetCreateEmployeeForm();
    this.currentStep.set(1);
  }

  resetCreateEmployeeForm() {
    // Step 1: User Account, Name/Surname, and Profile Image
    this.createEmployeeForm.userAccount.username.set("");
    this.createEmployeeForm.userAccount.password.set("");
    this.createEmployeeForm.userAccount.passwordConfirm.set("");
    this.createEmployeeForm.userAccount.email.set("");
    this.createEmployeeForm.userAccount.isActive.set(true);
    this.createEmployeeForm.name.set("");
    this.createEmployeeForm.lastName.set("");
    this.createEmployeeForm.profileImage.imageFile.set(null);
    this.createEmployeeForm.profileImage.imagePreview.set(null);

    // Step 2: Citizen Identity + Position + Communication
    this.createEmployeeForm.citizen.identityNumber.set("");
    this.createEmployeeForm.citizen.birthDate.set(null);
    this.createEmployeeForm.citizen.birthPlace.set("");
    this.createEmployeeForm.communication.workPhone.set("");
    this.createEmployeeForm.communication.mobilePhone.set("");
    this.createEmployeeForm.communication.workEmail.set("");
    this.createEmployeeForm.communication.personalEmail.set("");
    this.createEmployeeForm.position.registrationNumber.set("");
    this.createEmployeeForm.position.organizationId.set(null);
    this.createEmployeeForm.position.dutyId.set(null);
    this.createEmployeeForm.position.titleId.set(null);
    this.createEmployeeForm.position.startDate.set("");

    // Step 3: Education (optional)
    this.createEmployeeForm.education.set([
      {
        educationTypeId: null,
        universityId: null,
        departmentId: null,
        startDate: "",
        endDate: null,
      },
    ]);

    // Reset touched states
    this.step1Touched.username.set(false);
    this.step1Touched.password.set(false);
    this.step1Touched.passwordConfirm.set(false);
    this.step1Touched.email.set(false);
    this.step1Touched.name.set(false);
    this.step1Touched.lastName.set(false);
    this.step2Touched.identityNumber.set(false);
    this.step2Touched.workPhone.set(false);
    this.step2Touched.mobilePhone.set(false);
    this.step2Touched.organizationId.set(false);
    this.step2Touched.dutyId.set(false);
    this.step2Touched.startDate.set(false);
  }

  // Wizard Navigation
  goToNextStep() {
    if (this.currentStep() < 3) {
      if (this.isCurrentStepValid()) {
        this.currentStep.set(this.currentStep() + 1);
      }
    }
  }

  goToPreviousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  goToStep(step: number) {
    if (step >= 1 && step <= 3) {
      this.currentStep.set(step);
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.isStep1Valid();
      case 2:
        return this.isStep2Valid();
      case 3:
        return true; // Education is optional
      default:
        return false;
    }
  }

  // Step 1 Validation: User Account + Name/Surname (username, email, password, passwordConfirm, name, lastName)
  isStep1Valid(): boolean {
    const username = this.createEmployeeForm.userAccount.username();
    const email = this.createEmployeeForm.userAccount.email();
    const password = this.createEmployeeForm.userAccount.password();
    const passwordConfirm =
      this.createEmployeeForm.userAccount.passwordConfirm();
    const name = this.createEmployeeForm.name();
    const lastName = this.createEmployeeForm.lastName();

    return (
      !!username &&
      !!email &&
      this.isValidEmail(email) &&
      !!password &&
      password.length >= 6 &&
      !!passwordConfirm &&
      password === passwordConfirm &&
      !!name &&
      !!lastName
    );
  }

  shouldShowStep1UsernameError(): boolean {
    return (
      this.step1Touched.username() &&
      !this.createEmployeeForm.userAccount.username()
    );
  }

  shouldShowStep1EmailError(): boolean {
    return (
      this.step1Touched.email() &&
      (!this.createEmployeeForm.userAccount.email() ||
        !this.isValidEmail(this.createEmployeeForm.userAccount.email()))
    );
  }

  getStep1EmailError(): string {
    if (!this.createEmployeeForm.userAccount.email())
      return "E-posta alanı zorunludur";
    if (!this.isValidEmail(this.createEmployeeForm.userAccount.email()))
      return "Geçerli bir e-posta adresi giriniz";
    return "";
  }

  shouldShowStep1PasswordError(): boolean {
    return (
      this.step1Touched.password() &&
      (!this.createEmployeeForm.userAccount.password() ||
        this.createEmployeeForm.userAccount.password().length < 6)
    );
  }

  getStep1PasswordError(): string {
    if (!this.createEmployeeForm.userAccount.password())
      return "Şifre alanı zorunludur";
    if (this.createEmployeeForm.userAccount.password().length < 6)
      return "Şifre en az 6 karakter olmalıdır";
    return "";
  }

  shouldShowStep1PasswordConfirmError(): boolean {
    return (
      this.step1Touched.passwordConfirm() &&
      (!this.createEmployeeForm.userAccount.passwordConfirm() ||
        this.createEmployeeForm.userAccount.password() !==
          this.createEmployeeForm.userAccount.passwordConfirm())
    );
  }

  getStep1PasswordConfirmError(): string {
    if (!this.createEmployeeForm.userAccount.passwordConfirm())
      return "Şifre tekrar alanı zorunludur";
    if (
      this.createEmployeeForm.userAccount.password() !==
      this.createEmployeeForm.userAccount.passwordConfirm()
    )
      return "Şifreler eşleşmiyor";
    return "";
  }

  shouldShowStep1NameError(): boolean {
    return this.step1Touched.name() && !this.createEmployeeForm.name();
  }

  shouldShowStep1LastNameError(): boolean {
    return this.step1Touched.lastName() && !this.createEmployeeForm.lastName();
  }

  // Step 2 Validation: Citizen Identity + Position (identityNumber, organizationId, dutyId, startDate)
  isStep2Valid(): boolean {
    const tc = this.createEmployeeForm.citizen.identityNumber();
    return (
      !!tc &&
      tc.length === 11 &&
      !!this.createEmployeeForm.position.organizationId() &&
      !!this.createEmployeeForm.position.dutyId() &&
      !!this.createEmployeeForm.position.startDate()
    );
  }

  shouldShowStep2IdentityError(): boolean {
    return (
      this.step2Touched.identityNumber() &&
      !this.createEmployeeForm.citizen.identityNumber()
    );
  }

  getStep2IdentityError(): string {
    const tc = this.createEmployeeForm.citizen.identityNumber();
    if (!tc) return "TC Kimlik Numarası zorunludur";
    if (tc.length !== 11) return "TC Kimlik Numarası 11 haneli olmalıdır";
    return "";
  }

  shouldShowStep2OrganizationError(): boolean {
    return (
      this.step2Touched.organizationId() &&
      !this.createEmployeeForm.position.organizationId()
    );
  }

  shouldShowStep2DutyError(): boolean {
    return (
      this.step2Touched.dutyId() && !this.createEmployeeForm.position.dutyId()
    );
  }

  shouldShowStep2StartDateError(): boolean {
    return (
      this.step2Touched.startDate() &&
      !this.createEmployeeForm.position.startDate()
    );
  }

  // Step 3 is optional (Education)

  // Education Management (Step 4)
  addEducation() {
    const currentEducation = this.createEmployeeForm.education();
    this.createEmployeeForm.education.set([
      ...currentEducation,
      {
        educationTypeId: null,
        universityId: null,
        departmentId: null,
        startDate: "",
        endDate: null,
      },
    ]);
  }

  removeEducation(index: number) {
    const currentEducation = this.createEmployeeForm.education();
    if (currentEducation.length > 1) {
      this.createEmployeeForm.education.set(
        currentEducation.filter((_, i) => i !== index),
      );
    }
  }

  updateEducation(index: number, field: keyof EducationInfo, value: any) {
    const currentEducation = this.createEmployeeForm.education();
    const updated = [...currentEducation];
    updated[index] = { ...updated[index], [field]: value };
    this.createEmployeeForm.education.set(updated);
  }

  // Profile Image Management (Part of Step 1)
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.createEmployeeForm.profileImage.imageFile.set(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.createEmployeeForm.profileImage.imagePreview.set(
          e.target?.result as string,
        );
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.createEmployeeForm.profileImage.imageFile.set(null);
    this.createEmployeeForm.profileImage.imagePreview.set(null);
  }

  // Check if entire form is valid
  isFormValid(): boolean {
    return (
      this.isStep1Valid() && this.isStep2Valid()
      // Step 3 (education) is optional
    );
  }

  // Final Submit
  submitCreateEmployeeForm() {
    // Mark all required fields as touched
    // Step 1: User Account + Name/Surname
    this.step1Touched.username.set(true);
    this.step1Touched.email.set(true);
    this.step1Touched.password.set(true);
    this.step1Touched.passwordConfirm.set(true);
    this.step1Touched.name.set(true);
    this.step1Touched.lastName.set(true);

    // Step 2: Citizen Identity + Position + Communication
    this.step2Touched.identityNumber.set(true);
    this.step2Touched.workPhone.set(true);
    this.step2Touched.mobilePhone.set(true);
    this.step2Touched.organizationId.set(true);
    this.step2Touched.dutyId.set(true);
    this.step2Touched.startDate.set(true);

    // Validate all steps (1-2, step 3 is optional education)
    if (!this.isStep1Valid() || !this.isStep2Valid()) {
      // Find first invalid step
      if (!this.isStep1Valid()) this.currentStep.set(1);
      else if (!this.isStep2Valid()) this.currentStep.set(2);
      return;
    }

    this.createFormSubmitting.set(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Creating employee:", {
        userAccount: {
          username: this.createEmployeeForm.userAccount.username(),
          email: this.createEmployeeForm.userAccount.email(),
          isActive: this.createEmployeeForm.userAccount.isActive(),
        },
        name: this.createEmployeeForm.name(),
        lastName: this.createEmployeeForm.lastName(),
        profileImage: {
          hasImage: !!this.createEmployeeForm.profileImage.imageFile(),
        },
        citizen: {
          identityNumber: this.createEmployeeForm.citizen.identityNumber(),
          birthDate: this.createEmployeeForm.citizen.birthDate(),
          birthPlace: this.createEmployeeForm.citizen.birthPlace(),
        },
        position: {
          registrationNumber:
            this.createEmployeeForm.position.registrationNumber(),
          organizationId: this.createEmployeeForm.position.organizationId(),
          dutyId: this.createEmployeeForm.position.dutyId(),
          titleId: this.createEmployeeForm.position.titleId(),
          startDate: this.createEmployeeForm.position.startDate(),
        },
        communication: {
          workPhone: this.createEmployeeForm.communication.workPhone(),
          mobilePhone: this.createEmployeeForm.communication.mobilePhone(),
          workEmail: this.createEmployeeForm.communication.workEmail(),
          personalEmail: this.createEmployeeForm.communication.personalEmail(),
        },
        education: this.createEmployeeForm.education(),
      });

      this.createFormSubmitting.set(false);
      this.closeCreateModal();
    }, 1500);
  }

  // Edit Modal methods
  closeEditModal() {
    this.editModalOpen.set(false);
    this.selectedUser.set(null);
    this.changePassword.set(false);
  }

  // Edit form validation
  shouldShowEditFirstNameError(): boolean {
    return this.editFormTouched.firstName() && !this.editForm.firstName();
  }

  getEditFirstNameError(): string {
    if (!this.editForm.firstName()) return "Ad alanı zorunludur";
    return "";
  }

  shouldShowEditLastNameError(): boolean {
    return this.editFormTouched.lastName() && !this.editForm.lastName();
  }

  getEditLastNameError(): string {
    if (!this.editForm.lastName()) return "Soyad alanı zorunludur";
    return "";
  }

  shouldShowEditEmailError(): boolean {
    return (
      this.editFormTouched.email() &&
      (!this.editForm.email() || !this.isValidEmail(this.editForm.email()))
    );
  }

  getEditEmailError(): string {
    if (!this.editForm.email()) return "E-posta alanı zorunludur";
    if (!this.isValidEmail(this.editForm.email()))
      return "Geçerli bir e-posta adresi giriniz";
    return "";
  }

  shouldShowEditUsernameError(): boolean {
    return this.editFormTouched.username() && !this.editForm.username();
  }

  getEditUsernameError(): string {
    if (!this.editForm.username()) return "Kullanıcı adı alanı zorunludur";
    return "";
  }

  shouldShowEditPasswordError(): boolean {
    return (
      this.changePassword() &&
      this.editFormTouched.password() &&
      (!this.editForm.password() || this.editForm.password().length < 6)
    );
  }

  getEditPasswordError(): string {
    if (!this.editForm.password()) return "Şifre alanı zorunludur";
    if (this.editForm.password().length < 6)
      return "Şifre en az 6 karakter olmalıdır";
    return "";
  }

  shouldShowEditPasswordConfirmError(): boolean {
    return (
      this.changePassword() &&
      this.editFormTouched.passwordConfirm() &&
      (!this.editForm.passwordConfirm() ||
        this.editForm.password() !== this.editForm.passwordConfirm())
    );
  }

  getEditPasswordConfirmError(): string {
    if (!this.editForm.passwordConfirm())
      return "Şifre tekrar alanı zorunludur";
    if (this.editForm.password() !== this.editForm.passwordConfirm())
      return "Şifreler eşleşmiyor";
    return "";
  }

  isEditFormValid(): boolean {
    const basicValidation =
      !!this.editForm.firstName() &&
      !!this.editForm.lastName() &&
      !!this.editForm.email() &&
      this.isValidEmail(this.editForm.email()) &&
      !!this.editForm.username();

    if (!this.changePassword()) {
      return basicValidation;
    }

    return (
      basicValidation &&
      !!this.editForm.password() &&
      this.editForm.password().length >= 6 &&
      !!this.editForm.passwordConfirm() &&
      this.editForm.password() === this.editForm.passwordConfirm()
    );
  }

  submitEditForm() {
    // Mark all fields as touched
    this.editFormTouched.firstName.set(true);
    this.editFormTouched.lastName.set(true);
    this.editFormTouched.email.set(true);
    this.editFormTouched.username.set(true);

    if (this.changePassword()) {
      this.editFormTouched.password.set(true);
      this.editFormTouched.passwordConfirm.set(true);
    }

    if (!this.isEditFormValid()) {
      return;
    }

    this.editFormSubmitting.set(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Updating user:", {
        id: this.editForm.id(),
        firstName: this.editForm.firstName(),
        lastName: this.editForm.lastName(),
        email: this.editForm.email(),
        username: this.editForm.username(),
        organizationId: this.editForm.organizationId(),
        isActive: this.editForm.isActive(),
        changePassword: this.changePassword(),
      });

      this.editFormSubmitting.set(false);
      this.closeEditModal();
    }, 1000);
  }

  // Delete Modal methods
  closeDeleteModal() {
    this.deleteModalOpen.set(false);
    this.selectedUser.set(null);
  }

  confirmDelete() {
    if (!this.selectedUser()) return;

    console.log("Deleting user:", this.selectedUser());

    // Simulate API call
    setTimeout(() => {
      this.closeDeleteModal();
    }, 500);
  }

  // Helper methods
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
