import {
  Component,
  OnInit,
  signal,
  effect,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PhoneMaskDirective } from "../../directives/phone-mask.directive";
import { DatepickerDirective } from "../../directives/datepicker.directive";
import {
  EmployeeService,
  CreateEmployeeWithUserCommand,
  UpdateEmployeeWithUserCommand,
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
import { MetronicInitService } from "../../core/services/metronic-init.service";

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
export class UserManagementComponent implements OnInit, AfterViewChecked {
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
  editCurrentStep = signal(1);

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

  // Edit form - Full employee data
  editForm = {
    employeeId: signal(""),
    userId: signal(""),
    firstName: signal(""),
    lastName: signal(""),
    email: signal(""),
    username: signal(""),
    password: signal(""),
    passwordConfirm: signal(""),
    identityNumber: signal(""),
    birthDate: signal<string | null>(null),
    birthPlace: signal(""),
    workPhone: signal(""),
    mobilePhone: signal(""),
    workEmail: signal(""),
    personalEmail: signal(""),
    registrationNumber: signal(""),
    organizationId: signal<string | null>(null),
    dutyId: signal<number | null>(null),
    titleId: signal<number | null>(null),
    startDate: signal(""),
    isActive: signal(true),
    roles: signal<RoleAssignment[]>([]),
    education: signal<EducationInfo[]>([]),
  };

  editFormTouched = {
    firstName: signal(false),
    lastName: signal(false),
    email: signal(false),
    username: signal(false),
    password: signal(false),
    passwordConfirm: signal(false),
    identityNumber: signal(false),
    organizationId: signal(false),
    dutyId: signal(false),
    startDate: signal(false),
  };

  private searchTimeout: any;

  // Flags to track if modal selects have been initialized
  private createModalSelectsInitialized = false;
  private editModalSelectsInitialized = false;

  constructor(
    private employeeService: EmployeeService,
    private organizationService: OrganizationService,
    private roleService: RoleService,
    private referenceService: ReferenceService,
    private notificationService: NotificationService,
    private metronicInit: MetronicInitService,
  ) {}

  ngOnInit() {
    this.loadDropdownData();
    this.loadEmployees();

    // Initialize select and tooltip components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Initialize create modal selects only once when modal is open
    if (this.createModalOpen() && !this.createModalSelectsInitialized) {
      let selectsFound = false;

      // Step 2: Check for organization, duty, and title selects
      if (this.currentStep() === 2) {
        const createModalOrganizationId = document.getElementById(
          "createModalOrganizationId",
        );
        const createModalDutyId = document.getElementById("createModalDutyId");
        const createModalTitleId =
          document.getElementById("createModalTitleId");

        if (
          createModalOrganizationId &&
          createModalDutyId &&
          createModalTitleId
        ) {
          selectsFound = true;
        }
      }

      // Step 3: Check for role assignment selects (dynamic IDs)
      if (this.currentStep() === 3) {
        const roleOrgSelect = document.getElementById("roleOrganization_0");
        const roleRoleSelect = document.getElementById("roleRole_0");

        if (roleOrgSelect || roleRoleSelect) {
          selectsFound = true;
        }
      }

      // Step 4: Check for education selects (dynamic IDs)
      if (this.currentStep() === 4) {
        const educationTypeSelect = document.getElementById("educationType_0");
        const universitySelect = document.getElementById("university_0");
        const departmentSelect = document.getElementById("department_0");

        if (educationTypeSelect || universitySelect || departmentSelect) {
          selectsFound = true;
        }
      }

      // Initialize all selects if any are found
      if (selectsFound) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.createModalSelectsInitialized = true;
        }, 0);
      }
    }

    // Reset flag when modal is closed
    if (!this.createModalOpen() && this.createModalSelectsInitialized) {
      this.createModalSelectsInitialized = false;
    }

    // Initialize edit modal selects only once when modal is open
    if (this.editModalOpen() && !this.editModalSelectsInitialized) {
      const editModalOrganizationId = document.getElementById(
        "editModalOrganizationId",
      );

      if (editModalOrganizationId) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.editModalSelectsInitialized = true;
        }, 0);
      }
    }

    // Reset flag when modal is closed
    if (!this.editModalOpen() && this.editModalSelectsInitialized) {
      this.editModalSelectsInitialized = false;
    }
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

    // Set basic user data
    this.editForm.employeeId.set(user.id);
    this.editForm.userId.set(user.id);
    this.editForm.firstName.set(firstName);
    this.editForm.lastName.set(lastName);
    this.editForm.email.set(user.email || "");
    this.editForm.username.set(user.userName || "");
    this.editForm.isActive.set(user.isActive);

    // Reset password fields
    this.editForm.password.set("");
    this.editForm.passwordConfirm.set("");
    this.changePassword.set(false);

    // Set additional fields (these will be empty for now, but ready for API data)
    this.editForm.identityNumber.set("");
    this.editForm.birthDate.set(null);
    this.editForm.birthPlace.set("");
    this.editForm.workPhone.set("");
    this.editForm.mobilePhone.set("");
    this.editForm.workEmail.set("");
    this.editForm.personalEmail.set("");
    this.editForm.registrationNumber.set("");
    this.editForm.organizationId.set(null);
    this.editForm.dutyId.set(null);
    this.editForm.titleId.set(null);
    this.editForm.startDate.set("");
    this.editForm.roles.set([{ organizationId: null, roleId: null }]);
    this.editForm.education.set([
      {
        educationTypeId: null,
        universityId: null,
        departmentId: null,
        startDate: "",
        endDate: null,
      },
    ]);

    // Reset touched state
    this.editFormTouched.firstName.set(false);
    this.editFormTouched.lastName.set(false);
    this.editFormTouched.email.set(false);
    this.editFormTouched.username.set(false);
    this.editFormTouched.password.set(false);
    this.editFormTouched.passwordConfirm.set(false);
    this.editFormTouched.identityNumber.set(false);
    this.editFormTouched.organizationId.set(false);
    this.editFormTouched.dutyId.set(false);
    this.editFormTouched.startDate.set(false);

    this.editCurrentStep.set(1);
    this.editModalOpen.set(true);

    // Fetch full employee data from API
    this.employeeService.getEmployeeById(user.id).subscribe({
      next: (response) => {
        console.log("=== API Response ===", response);
        const employee = response.data;
        console.log("=== Employee Data ===", employee);

        // Update createEmployeeForm with full employee data (edit modal uses createEmployeeForm)
        console.log("Setting form values...");
        this.createEmployeeForm.userAccount.username.set(
          employee.username || "",
        );
        this.createEmployeeForm.userAccount.email.set(employee.email || "");
        this.createEmployeeForm.userAccount.isActive.set(employee.isActive);
        this.createEmployeeForm.name.set(employee.name || "");
        this.createEmployeeForm.lastName.set(employee.lastName || "");

        this.createEmployeeForm.citizen.identityNumber.set(
          employee.identityNumber || "",
        );
        this.createEmployeeForm.citizen.birthDate.set(
          employee.birthDate || null,
        );
        this.createEmployeeForm.citizen.birthPlace.set(
          employee.birthPlace || "",
        );

        this.createEmployeeForm.communication.workPhone.set(
          employee.workPhone || "",
        );
        this.createEmployeeForm.communication.mobilePhone.set(
          employee.mobilePhone || "",
        );
        this.createEmployeeForm.communication.workEmail.set(
          employee.workEmail || "",
        );
        this.createEmployeeForm.communication.personalEmail.set(
          employee.personalEmail || "",
        );

        this.createEmployeeForm.position.registrationNumber.set(
          employee.registrationNumber || "",
        );
        this.createEmployeeForm.position.organizationId.set(
          employee.organizationId || null,
        );
        this.createEmployeeForm.position.dutyId.set(
          employee.dutyId?.toString() || null,
        );
        this.createEmployeeForm.position.titleId.set(
          employee.titleId?.toString() || null,
        );
        this.createEmployeeForm.position.startDate.set(
          employee.startDate || "",
        );

        // Store IDs for update
        this.editForm.employeeId.set(employee.employeeId);
        this.editForm.userId.set(employee.userId);

        // Set roles (map from UserRoleInfo to RoleAssignment)
        if (employee.roles && employee.roles.length > 0) {
          const roleAssignments = employee.roles.map((role) => ({
            organizationId: role.organizationId,
            roleId: role.roleId,
          }));
          this.createEmployeeForm.roles.set(roleAssignments);
        } else {
          this.createEmployeeForm.roles.set([
            { organizationId: null, roleId: null },
          ]);
        }

        // Set education (map from EducationInfo to form structure)
        if (employee.education && employee.education.length > 0) {
          const educationList = employee.education.map((edu) => ({
            educationTypeId: edu.educationTypeId?.toString() || null,
            universityId: edu.universityId?.toString() || null,
            departmentId: edu.departmentId?.toString() || null,
            startDate: edu.startDate || "",
            endDate: edu.endDate || null,
          }));
          this.createEmployeeForm.education.set(educationList);
        } else {
          this.createEmployeeForm.education.set([
            {
              educationTypeId: null,
              universityId: null,
              departmentId: null,
              startDate: "",
              endDate: null,
            },
          ]);
        }

        // Trigger select initialization after data is loaded
        this.editModalSelectsInitialized = false;

        console.log("=== Final Form State ===");
        console.log(
          "username:",
          this.createEmployeeForm.userAccount.username(),
        );
        console.log("name:", this.createEmployeeForm.name());
        console.log("lastName:", this.createEmployeeForm.lastName());
        console.log("email:", this.createEmployeeForm.userAccount.email());
        console.log(
          "workPhone:",
          this.createEmployeeForm.communication.workPhone(),
        );
        console.log(
          "mobilePhone:",
          this.createEmployeeForm.communication.mobilePhone(),
        );
        console.log(
          "organizationId:",
          this.createEmployeeForm.position.organizationId(),
        );
        console.log("dutyId:", this.createEmployeeForm.position.dutyId());
        console.log("titleId:", this.createEmployeeForm.position.titleId());
        console.log("startDate:", this.createEmployeeForm.position.startDate());
        console.log(
          "identityNumber:",
          this.createEmployeeForm.citizen.identityNumber(),
        );
        console.log("roles:", this.createEmployeeForm.roles());
        console.log("education:", this.createEmployeeForm.education());
      },
      error: (error) => {
        console.error("Error fetching employee details:", error);
        // Modal is already open with basic data, user can still see the form
      },
    });
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

        // Reset select initialization flag when changing steps
        this.createModalSelectsInitialized = false;
      }
    }
  }

  goToPreviousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);

      // Reset select initialization flag when changing steps
      this.createModalSelectsInitialized = false;
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

      // Reset select initialization flag when changing steps
      // This ensures selects are re-initialized when returning to a step
      this.createModalSelectsInitialized = false;
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

    // Reset flag to reinitialize selects for the new row
    this.createModalSelectsInitialized = false;
  }

  removeEducation(index: number) {
    const currentEducation = this.createEmployeeForm.education();
    if (currentEducation.length > 1) {
      this.createEmployeeForm.education.set(
        currentEducation.filter((_, i) => i !== index),
      );

      // Reset flag to reinitialize selects after removal
      this.createModalSelectsInitialized = false;
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

    // Reset flag to reinitialize selects for the new row
    this.createModalSelectsInitialized = false;
  }

  removeRole(index: number) {
    const currentRoles = this.createEmployeeForm.roles();
    if (currentRoles.length > 1) {
      this.createEmployeeForm.roles.set(
        currentRoles.filter((_, i) => i !== index),
      );

      // Reset flag to reinitialize selects after removal
      this.createModalSelectsInitialized = false;
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
    this.editCurrentStep.set(1);
  }

  // Edit form role management
  addEditRole(): void {
    const currentRoles = this.editForm.roles();
    this.editForm.roles.set([
      ...currentRoles,
      { organizationId: null, roleId: null },
    ]);
    this.editModalSelectsInitialized = false;
  }

  removeEditRole(index: number): void {
    const currentRoles = this.editForm.roles();
    if (currentRoles.length > 1) {
      this.editForm.roles.set(currentRoles.filter((_, i) => i !== index));
      this.editModalSelectsInitialized = false;
    }
  }

  updateEditRole(index: number, field: keyof RoleAssignment, value: any): void {
    const currentRoles = this.editForm.roles();
    const updated = [...currentRoles];
    updated[index] = { ...updated[index], [field]: value };
    this.editForm.roles.set(updated);
  }

  // Edit form education management
  addEditEducation(): void {
    const currentEducation = this.editForm.education();
    this.editForm.education.set([
      ...currentEducation,
      {
        educationTypeId: null,
        universityId: null,
        departmentId: null,
        startDate: "",
        endDate: null,
      },
    ]);
    this.editModalSelectsInitialized = false;
  }

  removeEditEducation(index: number): void {
    const currentEducation = this.editForm.education();
    if (currentEducation.length > 0) {
      this.editForm.education.set(
        currentEducation.filter((_, i) => i !== index),
      );
      this.editModalSelectsInitialized = false;
    }
  }

  updateEditEducation(
    index: number,
    field: keyof EducationInfo,
    value: any,
  ): void {
    const currentEducation = this.editForm.education();
    const updated = [...currentEducation];
    updated[index] = { ...updated[index], [field]: value };
    this.editForm.education.set(updated);
  }

  // Edit Wizard Navigation
  goToEditNextStep(): void {
    if (this.editCurrentStep() < 4) {
      if (this.isEditCurrentStepValid()) {
        this.markEditStepAsTouched(this.editCurrentStep());
        this.editCurrentStep.set(this.editCurrentStep() + 1);
        this.editModalSelectsInitialized = false;
      }
    }
  }

  goToEditPreviousStep(): void {
    if (this.editCurrentStep() > 1) {
      this.editCurrentStep.set(this.editCurrentStep() - 1);
      this.editModalSelectsInitialized = false;
    }
  }

  goToEditStep(step: number): void {
    if (step >= 1 && step <= 4) {
      if (step > this.editCurrentStep()) {
        for (let i = 1; i < step; i++) {
          this.markEditStepAsTouched(i);
        }
      }
      this.editCurrentStep.set(step);
      this.editModalSelectsInitialized = false;
    }
  }

  markEditStepAsTouched(step: number): void {
    switch (step) {
      case 1:
        this.editFormTouched.firstName.set(true);
        this.editFormTouched.lastName.set(true);
        this.editFormTouched.email.set(true);
        this.editFormTouched.username.set(true);
        break;
      case 2:
        this.editFormTouched.identityNumber.set(true);
        this.editFormTouched.organizationId.set(true);
        this.editFormTouched.dutyId.set(true);
        this.editFormTouched.startDate.set(true);
        break;
      case 3:
        break;
      case 4:
        break;
    }
  }

  getEditStepStatus(stepNumber: number): "completed" | "error" | "pending" {
    if (stepNumber > this.editCurrentStep()) {
      return "pending";
    }

    switch (stepNumber) {
      case 1:
        const step1Visited =
          this.editFormTouched.firstName() ||
          this.editFormTouched.lastName() ||
          this.editFormTouched.email() ||
          this.editFormTouched.username();

        if (!step1Visited && stepNumber < this.editCurrentStep()) {
          this.markEditStepAsTouched(1);
        }

        return this.isEditStep1Valid()
          ? "completed"
          : step1Visited || stepNumber < this.editCurrentStep()
            ? "error"
            : "pending";

      case 2:
        const step2Visited =
          this.editFormTouched.identityNumber() ||
          this.editFormTouched.organizationId() ||
          this.editFormTouched.dutyId() ||
          this.editFormTouched.startDate();

        if (!step2Visited && stepNumber < this.editCurrentStep()) {
          this.markEditStepAsTouched(2);
        }

        return this.isEditStep2Valid()
          ? "completed"
          : step2Visited || stepNumber < this.editCurrentStep()
            ? "error"
            : "pending";

      case 3:
        if (stepNumber < this.editCurrentStep()) {
          return this.isEditStep3Valid() ? "completed" : "error";
        }
        return "pending";

      case 4:
        return stepNumber <= this.editCurrentStep() ? "completed" : "pending";

      default:
        return "pending";
    }
  }

  isEditCurrentStepValid(): boolean {
    switch (this.editCurrentStep()) {
      case 1:
        return this.isEditStep1Valid();
      case 2:
        return this.isEditStep2Valid();
      case 3:
        return this.isEditStep3Valid();
      case 4:
        return true;
      default:
        return false;
    }
  }

  isEditStep1Valid(): boolean {
    const username = this.editForm.username();
    const email = this.editForm.email();
    const firstName = this.editForm.firstName();
    const lastName = this.editForm.lastName();

    return (
      !!username &&
      !!email &&
      this.isValidEmail(email) &&
      !!firstName &&
      !!lastName
    );
  }

  isEditStep2Valid(): boolean {
    const tc = this.editForm.identityNumber();
    return (
      !!tc &&
      tc.length === 11 &&
      !!this.editForm.organizationId() &&
      !!this.editForm.dutyId() &&
      !!this.editForm.startDate()
    );
  }

  isEditStep3Valid(): boolean {
    const roles = this.editForm.roles();
    return roles.every((role) => !!role.organizationId && !!role.roleId);
  }

  // Edit Step 1 validation helpers
  shouldShowEditStep1UsernameError(): boolean {
    return this.editFormTouched.username() && !this.editForm.username();
  }

  shouldShowEditStep1EmailError(): boolean {
    return (
      this.editFormTouched.email() &&
      (!this.editForm.email() || !this.isValidEmail(this.editForm.email()))
    );
  }

  getEditStep1EmailError(): string {
    if (!this.editForm.email()) return "E-posta alanı zorunludur";
    if (!this.isValidEmail(this.editForm.email()))
      return "Geçerli bir e-posta adresi giriniz";
    return "";
  }

  shouldShowEditStep1FirstNameError(): boolean {
    return this.editFormTouched.firstName() && !this.editForm.firstName();
  }

  shouldShowEditStep1LastNameError(): boolean {
    return this.editFormTouched.lastName() && !this.editForm.lastName();
  }

  shouldShowEditStep1NameError(): boolean {
    return (
      this.shouldShowEditStep1FirstNameError() ||
      this.shouldShowEditStep1LastNameError()
    );
  }

  shouldShowEditStep1PasswordError(): boolean {
    return (
      this.changePassword() &&
      this.editFormTouched.password() &&
      !this.editForm.password()
    );
  }

  getEditStep1PasswordError(): string {
    if (!this.editForm.password()) return "Şifre alanı zorunludur";
    if (this.editForm.password().length < 6)
      return "Şifre en az 6 karakter olmalıdır";
    return "";
  }

  shouldShowEditStep1PasswordConfirmError(): boolean {
    return (
      this.changePassword() &&
      this.editFormTouched.passwordConfirm() &&
      this.editForm.password() !== this.editForm.passwordConfirm()
    );
  }

  getEditStep1PasswordConfirmError(): string {
    if (!this.editForm.passwordConfirm())
      return "Şifre tekrar alanı zorunludur";
    if (this.editForm.password() !== this.editForm.passwordConfirm())
      return "Şifreler eşleşmiyor";
    return "";
  }

  // Edit Step 2 validation helpers
  shouldShowEditStep2IdentityError(): boolean {
    return (
      this.editFormTouched.identityNumber() && !this.editForm.identityNumber()
    );
  }

  getEditStep2IdentityError(): string {
    const tc = this.editForm.identityNumber();
    if (!tc) return "TC Kimlik Numarası zorunludur";
    if (tc.length !== 11) return "TC Kimlik Numarası 11 haneli olmalıdır";
    return "";
  }

  shouldShowEditStep2OrganizationError(): boolean {
    return (
      this.editFormTouched.organizationId() && !this.editForm.organizationId()
    );
  }

  shouldShowEditStep2DutyError(): boolean {
    return this.editFormTouched.dutyId() && !this.editForm.dutyId();
  }

  shouldShowEditStep2StartDateError(): boolean {
    return this.editFormTouched.startDate() && !this.editForm.startDate();
  }

  isEditFormValid(): boolean {
    // Step 1 validation
    if (!this.isEditStep1Valid()) return false;

    // Step 2 validation
    if (!this.isEditStep2Valid()) return false;

    // Step 3 validation (roles can be empty)
    if (!this.isEditStep3Valid()) return false;

    return true;
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

    // Prepare update command
    const command: UpdateEmployeeWithUserCommand = {
      employeeId: this.editForm.employeeId(),
      userId: this.editForm.userId(),
      username: this.editForm.username() || null,
      email: this.editForm.email() || null,
      name: this.editForm.firstName() || null,
      lastName: this.editForm.lastName() || null,
      workPhone: this.editForm.workPhone() || null,
      mobilePhone: this.editForm.mobilePhone() || null,
      birthDate: this.editForm.birthDate()
        ? new Date(this.editForm.birthDate()!)
        : null,
      birthPlace: this.editForm.birthPlace() || null,
      registrationNumber: this.editForm.registrationNumber() || null,
      organizationId: this.editForm.organizationId() || null,
      dutyId: this.editForm.dutyId() || null,
      titleId: this.editForm.titleId() || null,
      workEmail: this.editForm.workEmail() || null,
      personalEmail: this.editForm.personalEmail() || null,
      roles: this.editForm.roles().map((r) => ({
        organizationId: r.organizationId!,
        roleId: r.roleId!,
      })),
      education: this.editForm.education().map((e) => ({
        educationTypeId: e.educationTypeId
          ? parseInt(e.educationTypeId as any)
          : null,
        universityId: e.universityId ? parseInt(e.universityId as any) : null,
        departmentId: e.departmentId ? parseInt(e.departmentId as any) : null,
        startDate: e.startDate ? new Date(e.startDate) : new Date(),
        endDate: e.endDate ? new Date(e.endDate) : null,
      })),
      isActive: this.editForm.isActive(),
    };

    this.employeeService
      .updateEmployeeWithUser(this.editForm.employeeId(), command)
      .subscribe({
        next: () => {
          this.notificationService.success(
            "Kullanıcı başarıyla güncellendi!",
            "Başarılı",
          );
          this.editFormSubmitting.set(false);
          this.closeEditModal();
          this.refreshEmployeeList();
        },
        error: (error) => {
          console.error("Error updating user:", error);
          this.editFormSubmitting.set(false);
        },
      });
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
