import { Component, OnInit, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PhoneMaskDirective } from "../../directives/phone-mask.directive";
import { DatepickerDirective } from "../../directives/datepicker.directive";
import {
  EmployeeService,
  CreateEmployeeWithUserCommand,
  UserRoleDto,
  EducationDto,
} from "../../services/employee.service";
import {
  OrganizationService,
  OrganizationSelectResponse,
} from "../../services/organization.service";
import { RoleService, RoleSelectResponse } from "../../services/role.service";
import {
  ReferenceService,
  SelectItemResponse,
} from "../../services/reference.service";
import { NotificationService } from "../../core/services/notification.service";

// User Interface - Matches API Response
interface User {
  id: string; // UUID from API
  fullName: string;
  organizationName: string | null;
  isActive: boolean;
  userName: string | null;
  email: string | null;
  title: string | null;
  duty: string | null;
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

// Wizard Step 4: Rol Atama (Multiple)
interface RoleAssignment {
  organizationId: string | null;
  roleId: string | null;
}

// Wizard Step 5: Eğitim Bilgileri (Multiple, Optional)
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
  imports: [CommonModule, FormsModule, PhoneMaskDirective, DatepickerDirective],
  templateUrl: "./user-management.component.html",
  styleUrl: "./user-management.component.scss",
})
export class UserManagementComponent implements OnInit {
  // Dropdown data
  organizations = signal<OrganizationSelectResponse[]>([]);
  roles = signal<RoleSelectResponse[]>([]);
  duties = signal<SelectItemResponse[]>([]);
  titles = signal<SelectItemResponse[]>([]);
  educationTypes = signal<SelectItemResponse[]>([]);
  universities = signal<SelectItemResponse[]>([]);
  departments = signal<SelectItemResponse[]>([]);

  // Filters
  searchTerm = signal("");
  selectedRole = signal("");
  selectedStatus = signal("");

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Users data from API
  users = signal<User[]>([]);

  // Loading state
  isLoading = signal(false);

  // Math for template
  Math = Math;

  // Active users count
  get activeUsersCount(): number {
    return this.users().filter((u) => u.isActive).length;
  }

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

  // Wizard current step (1-4)
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
    // Step 4: Rol Atama (multiple)
    roles: signal<RoleAssignment[]>([
      {
        organizationId: null,
        roleId: null,
      },
    ]),
    // Step 5: Eğitim Bilgileri (optional, only if real person)
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

  private searchTimeout: any;

  constructor(
    private employeeService: EmployeeService,
    private organizationService: OrganizationService,
    private roleService: RoleService,
    private referenceService: ReferenceService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.loadDropdownData();
    this.loadEmployees();
  }

  loadEmployees() {
    this.isLoading.set(true);

    this.employeeService
      .getAllEmployeesPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        fullName: this.searchTerm() || undefined,
        organizationId: undefined,
        userName: undefined,
        email: undefined,
        isActive: this.selectedStatus()
          ? this.selectedStatus() === "active"
          : undefined,
      })
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            this.users.set(response.data);
          }

          if (response.pagination) {
            this.totalItems.set(response.pagination.totalItems);
            this.totalPages.set(response.pagination.totalPages);
            this.currentPage.set(response.pagination.page);
          }

          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error("Error loading employees:", error);
          this.isLoading.set(false);
        },
      });
  }

  private loadDropdownData() {
    // Load organizations
    this.organizationService.getAllOrganizationsForSelect().subscribe({
      next: (response) => {
        if (response.data) {
          this.organizations.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading organizations:", error);
      },
    });

    // Load roles
    this.roleService.getAllRolesForSelect().subscribe({
      next: (response) => {
        if (response.data) {
          this.roles.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading roles:", error);
      },
    });

    // Load employee duty types
    this.referenceService.getEmployeeDutyTypes().subscribe({
      next: (response) => {
        if (response.data) {
          this.duties.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading employee duty types:", error);
      },
    });

    // Load employee title types
    this.referenceService.getEmployeeTitleTypes().subscribe({
      next: (response) => {
        if (response.data) {
          this.titles.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading employee title types:", error);
      },
    });

    // Load education types
    this.referenceService.getEducationTypes().subscribe({
      next: (response) => {
        if (response.data) {
          this.educationTypes.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading education types:", error);
      },
    });

    // Load universities
    this.referenceService.getUniversities().subscribe({
      next: (response) => {
        if (response.data) {
          this.universities.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading universities:", error);
      },
    });

    // Load university departments
    this.referenceService.getUniversityDepartments().subscribe({
      next: (response) => {
        if (response.data) {
          this.departments.set(response.data);
        }
      },
      error: (error) => {
        console.error("Error loading university departments:", error);
      },
    });
  }

  // Methods
  onAddUser() {
    this.openCreateModal();
  }

  onEditUser(user: User) {
    this.selectedUser.set(user);
    // Parse name into first and last name
    const nameParts = user.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    this.editForm.id.set(0); // Keep as number for now, you may need to adjust based on your edit endpoint
    this.editForm.firstName.set(firstName);
    this.editForm.lastName.set(lastName);
    this.editForm.email.set(user.email || "");
    this.editForm.username.set(user.userName || "");
    this.editForm.password.set("");
    this.editForm.passwordConfirm.set("");
    this.editForm.organizationId.set(null);
    this.editForm.isActive.set(user.isActive);
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
    const newStatus = !user.isActive;

    // Update user status in the list optimistically
    const updatedUsers: User[] = this.users().map((u) =>
      u.id === user.id ? { ...u, isActive: newStatus } : u,
    );
    this.users.set(updatedUsers);

    // Here you would typically make an API call to update the status
    console.log(`User ${user.fullName} status changed to: ${newStatus}`);

    // TODO: Implement actual API call to update employee status
    // this.employeeService.updateEmployeeStatus(user.id, newStatus).subscribe(...)
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadEmployees();
  }

  // Search with debounce
  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadEmployees();
    }, 500);
  }

  // Filter methods
  openFilterOffcanvas() {
    this.filterOffcanvasOpen.set(true);
  }

  clearAllFilters() {
    this.searchTerm.set("");
    this.selectedRole.set("");
    this.selectedStatus.set("");
    this.currentPage.set(1);
    this.loadEmployees();
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
    if (this.currentStep() < 4) {
      if (this.isCurrentStepValid()) {
        // Mark current step fields as touched before moving
        this.markStepAsTouched(this.currentStep());
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
    if (step >= 1 && step <= 4) {
      // Mark all previous steps as touched if jumping forward
      if (step > this.currentStep()) {
        for (let i = 1; i < step; i++) {
          this.markStepAsTouched(i);
        }
      }
      this.currentStep.set(step);
    }
  }

  // Mark step fields as touched to trigger validation display
  markStepAsTouched(step: number) {
    switch (step) {
      case 1:
        this.step1Touched.username.set(true);
        this.step1Touched.email.set(true);
        this.step1Touched.password.set(true);
        this.step1Touched.passwordConfirm.set(true);
        this.step1Touched.name.set(true);
        this.step1Touched.lastName.set(true);
        break;
      case 2:
        this.step2Touched.identityNumber.set(true);
        this.step2Touched.organizationId.set(true);
        this.step2Touched.dutyId.set(true);
        this.step2Touched.startDate.set(true);
        break;
      case 3:
        // Roles don't have specific touched states but validate on check
        break;
      case 4:
        // Education is optional, no validation required
        break;
    }
  }

  // Check if a specific step has been visited and validated
  getStepStatus(stepNumber: number): "completed" | "error" | "pending" {
    // If we haven't reached this step yet, it's pending
    if (stepNumber > this.currentStep()) {
      return "pending";
    }

    // Check validation based on step
    switch (stepNumber) {
      case 1:
        // Check if any Step 1 field has been touched
        const step1Visited =
          this.step1Touched.username() ||
          this.step1Touched.email() ||
          this.step1Touched.password() ||
          this.step1Touched.passwordConfirm() ||
          this.step1Touched.name() ||
          this.step1Touched.lastName();

        if (!step1Visited && stepNumber < this.currentStep()) {
          // If we've moved past this step without touching fields, mark as touched
          this.markStepAsTouched(1);
        }

        return this.isStep1Valid()
          ? "completed"
          : step1Visited || stepNumber < this.currentStep()
            ? "error"
            : "pending";

      case 2:
        // Check if any Step 2 field has been touched
        const step2Visited =
          this.step2Touched.identityNumber() ||
          this.step2Touched.organizationId() ||
          this.step2Touched.dutyId() ||
          this.step2Touched.startDate();

        if (!step2Visited && stepNumber < this.currentStep()) {
          // If we've moved past this step without touching fields, mark as touched
          this.markStepAsTouched(2);
        }

        return this.isStep2Valid()
          ? "completed"
          : step2Visited || stepNumber < this.currentStep()
            ? "error"
            : "pending";

      case 3:
        // Roles validation - check if we've passed this step
        if (stepNumber < this.currentStep()) {
          return this.isStep3Valid() ? "completed" : "error";
        }
        return "pending";

      case 4:
        // Education is optional, always valid if visited
        return stepNumber <= this.currentStep() ? "completed" : "pending";

      default:
        return "pending";
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.isStep1Valid();
      case 2:
        return this.isStep2Valid();
      case 3:
        return this.isStep3Valid(); // Roles validation
      case 4:
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
      this.isPasswordValid(password) &&
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
        !this.isPasswordValid(this.createEmployeeForm.userAccount.password()))
    );
  }

  getStep1PasswordError(): string {
    const password = this.createEmployeeForm.userAccount.password();
    if (!password) return "Şifre alanı zorunludur";
    if (password.length < 8) return "Şifre en az 8 karakter olmalıdır";
    if (!/\d/.test(password)) return "Şifre en az bir rakam içermelidir";
    return "";
  }

  isPasswordValid(password: string): boolean {
    return password.length >= 8 && /\d/.test(password);
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

  // Step 3 Validation: Roles (at least one role with organization and role selected)
  isStep3Valid(): boolean {
    const roles = this.createEmployeeForm.roles();
    return roles.every((role) => !!role.organizationId && !!role.roleId);
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

  // Role Assignment Management (Step 4)
  addRole() {
    const currentRoles = this.createEmployeeForm.roles();
    this.createEmployeeForm.roles.set([
      ...currentRoles,
      {
        organizationId: null,
        roleId: null,
      },
    ]);
  }

  removeRole(index: number) {
    const currentRoles = this.createEmployeeForm.roles();
    if (currentRoles.length > 1) {
      this.createEmployeeForm.roles.set(
        currentRoles.filter((_, i) => i !== index),
      );
    }
  }

  updateRole(index: number, field: keyof RoleAssignment, value: any) {
    const currentRoles = this.createEmployeeForm.roles();
    const updated = [...currentRoles];
    updated[index] = { ...updated[index], [field]: value };
    this.createEmployeeForm.roles.set(updated);
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
    if (!this.isStep1Valid() || !this.isStep2Valid() || !this.isStep3Valid()) {
      // Find first invalid step
      if (!this.isStep1Valid()) this.currentStep.set(1);
      else if (!this.isStep2Valid()) this.currentStep.set(2);
      else if (!this.isStep3Valid()) this.currentStep.set(3);
      return;
    }

    this.createFormSubmitting.set(true);

    // Prepare the command for API
    const command: CreateEmployeeWithUserCommand = {
      username: this.createEmployeeForm.userAccount.username(),
      email: this.createEmployeeForm.userAccount.email(),
      password: this.createEmployeeForm.userAccount.password(),
      name: this.createEmployeeForm.name(),
      lastName: this.createEmployeeForm.lastName(),
      workPhone: this.createEmployeeForm.communication.workPhone() || null,
      mobilePhone: this.createEmployeeForm.communication.mobilePhone() || null,
      profileImageId: null, // Handle file upload separately if needed
      profileImageDescription: null,
      identityNumber: this.createEmployeeForm.citizen.identityNumber(),
      birthDate: this.createEmployeeForm.citizen.birthDate()
        ? new Date(this.createEmployeeForm.citizen.birthDate()!)
        : null,
      birthPlace: this.createEmployeeForm.citizen.birthPlace() || null,
      registrationNumber:
        this.createEmployeeForm.position.registrationNumber() || null,
      organizationId: this.createEmployeeForm.position.organizationId()!,
      dutyId: parseInt(this.createEmployeeForm.position.dutyId()!),
      titleId: this.createEmployeeForm.position.titleId()
        ? parseInt(this.createEmployeeForm.position.titleId()!)
        : null,
      startDate: new Date(this.createEmployeeForm.position.startDate()),
      workEmail: this.createEmployeeForm.communication.workEmail() || null,
      personalEmail:
        this.createEmployeeForm.communication.personalEmail() || null,
      roles: this.createEmployeeForm.roles().map((r) => ({
        organizationId: r.organizationId!,
        roleId: r.roleId!,
      })),
      education: this.createEmployeeForm.education().map((e) => ({
        educationTypeId: e.educationTypeId
          ? parseInt(e.educationTypeId as any)
          : null,
        universityId: e.universityId ? parseInt(e.universityId as any) : null,
        departmentId: e.departmentId ? parseInt(e.departmentId as any) : null,
        startDate: e.startDate ? new Date(e.startDate) : new Date(),
        endDate: e.endDate ? new Date(e.endDate) : null,
      })),
      isActive: this.createEmployeeForm.userAccount.isActive(),
    };

    // Call the API
    this.employeeService.createEmployeeWithUser(command).subscribe({
      next: (response) => {
        console.log("Employee created successfully:", response);
        this.createFormSubmitting.set(false);
        this.closeCreateModal();

        // Refresh the users list
        this.refreshEmployeeList();

        // Show success message
        this.notificationService.success(
          "Başarılı",
          "Kullanıcı başarıyla oluşturuldu!",
        );
      },
      error: (error) => {
        console.error("Error creating employee:", error);
        this.createFormSubmitting.set(false);

        // Error interceptor otomatik olarak notification gösterecek
        // Bu yüzden burada tekrar çağırmaya gerek yok
      },
    });
  }

  // Refresh employee list after create
  private refreshEmployeeList() {
    this.currentPage.set(1);
    this.loadEmployees();
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
