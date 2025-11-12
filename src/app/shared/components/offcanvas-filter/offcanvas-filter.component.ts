import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  effect,
  inject,
  OnInit,
  AfterViewChecked,
  HostListener,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  FilterDrawerConfig,
  FilterFieldConfig,
  FilterValues,
} from "../filter-drawer/filter-config.interface";
import { MetronicInitService } from "../../../core/services/metronic-init.service";
import { KTSelectService } from "../../../core/services/kt-select.service";

@Component({
  selector: "app-offcanvas-filter",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./offcanvas-filter.component.html",
  styleUrls: ["./offcanvas-filter.component.scss"],
})
export class OffcanvasFilterComponent
  implements OnInit, AfterViewChecked, OnChanges, OnDestroy
{
  private metronicInit = inject(MetronicInitService);
  private cdr = inject(ChangeDetectorRef);
  private ktSelectService = inject(KTSelectService);

  /** Track select element IDs for cleanup */
  private selectElementIds: Set<string> = new Set();

  /**
   * Handle ESC key press to close offcanvas
   */
  @HostListener("document:keydown.escape", ["$event"])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.close();
    }
  }

  /**
   * Handle ENTER key press to apply filters
   */
  @HostListener("document:keydown.enter", ["$event"])
  onEnterKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      event.preventDefault();
      this.applyFilters();
    }
  }

  /** Filter configuration */
  @Input() config!: FilterDrawerConfig;

  /** Initial filter values */
  @Input() initialValues: FilterValues = {};

  /** Show/hide offcanvas */
  @Input() isOpen: boolean = false;

  /** Emits when filters are applied */
  @Output() filtersApplied = new EventEmitter<FilterValues>();

  /** Emits when filters are cleared */
  @Output() filtersCleared = new EventEmitter<void>();

  /** Emits when offcanvas is toggled */
  @Output() toggleOffcanvas = new EventEmitter<boolean>();

  /** Current filter values */
  filterValues = signal<FilterValues>({});

  /** Flag to track if selects need reinitialization */
  private needsSelectInit = false;

  constructor() {
    // Watch for config changes to initialize default values
    effect(() => {
      if (this.config) {
        this.initializeFilterValues();
        this.needsSelectInit = true;
      }
    });

    // Watch for isOpen changes to reinitialize selects when offcanvas opens
    effect(() => {
      if (this.isOpen) {
        // Use Promise.resolve to wait for DOM to be ready
        Promise.resolve().then(() => {
          this.cdr.detectChanges();
          this.metronicInit.initSelect();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initializeFilterValues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update filter values when initialValues prop changes
    if (changes["initialValues"]) {
      this.initializeFilterValues();
    }

    // When offcanvas opens, reinitialize values and selects
    if (changes["isOpen"] && changes["isOpen"].currentValue === true) {
      // Reinitialize filter values from initialValues when opening
      this.initializeFilterValues();

      Promise.resolve().then(() => {
        this.cdr.detectChanges();
        this.metronicInit.initSelect();
      });
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsSelectInit) {
      this.metronicInit.initSelect();
      this.needsSelectInit = false;
    }
  }

  /**
   * Initialize filter values from config and initial values
   */
  private initializeFilterValues(): void {
    const values: FilterValues = {};

    this.config?.fields?.forEach((field) => {
      if (this.initialValues[field.key] !== undefined) {
        values[field.key] = this.initialValues[field.key];
      } else if (field.defaultValue !== undefined) {
        values[field.key] = field.defaultValue;
      } else {
        // Set default empty values based on type
        switch (field.type) {
          case "text":
          case "number":
            values[field.key] = "";
            break;
          case "select":
          case "radio":
            values[field.key] = null;
            break;
          case "multiselect":
            values[field.key] = [];
            break;
          case "checkbox":
          case "switch":
            values[field.key] = false;
            break;
          case "date":
            values[field.key] = null;
            break;
          case "daterange":
            values[field.key] = { start: null, end: null };
            break;
          default:
            values[field.key] = null;
        }
      }
    });

    this.filterValues.set(values);
    this.needsSelectInit = true;
  }

  /**
   * Update a specific filter value
   */
  updateFilterValue(key: string, value: any): void {
    const current = this.filterValues();
    this.filterValues.set({ ...current, [key]: value });
  }

  /**
   * Get value for a specific field
   */
  getFieldValue(key: string): any {
    return this.filterValues()[key];
  }

  /**
   * Close offcanvas
   */
  close(): void {
    this.toggleOffcanvas.emit(false);
  }

  /**
   * Apply filters and close
   */
  applyFilters(): void {
    // Clean up empty values before emitting
    const cleanedValues: FilterValues = {};
    const values = this.filterValues();

    Object.keys(values).forEach((key) => {
      const value = values[key];

      // Skip empty/null values
      if (value === null || value === undefined || value === "") {
        return;
      }

      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      // Skip empty objects
      if (typeof value === "object" && !Array.isArray(value)) {
        const hasValue = Object.values(value).some(
          (v) => v !== null && v !== undefined && v !== "",
        );
        if (!hasValue) {
          return;
        }
      }

      cleanedValues[key] = value;
    });

    this.filtersApplied.emit(cleanedValues);
    this.close();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    // Clear all field values to default empty
    const clearedValues: FilterValues = {};
    this.config?.fields?.forEach((field) => {
      // Generate element ID for this field
      const elementId = `filter-${field.key}`;

      switch (field.type) {
        case "text":
        case "number":
          clearedValues[field.key] = "";
          break;
        case "select":
          clearedValues[field.key] = null;
          // Clear KT Select using service (with sync to native element)
          this.ktSelectService.clearSelectionWithSync(elementId);
          break;
        case "radio":
          clearedValues[field.key] = null;
          break;
        case "multiselect":
          clearedValues[field.key] = [];
          // Clear KT MultiSelect using service (with sync to native element)
          this.ktSelectService.clearSelectionWithSync(elementId);
          break;
        case "checkbox":
        case "switch":
          clearedValues[field.key] = false;
          break;
        case "date":
          clearedValues[field.key] = null;
          break;
        default:
          clearedValues[field.key] = null;
      }
    });

    this.filterValues.set(clearedValues);
    this.filtersCleared.emit();

    // Reinitialize selects after clearing
    Promise.resolve().then(() => {
      this.cdr.detectChanges();
      this.metronicInit.initSelect();
    });
  }

  /**
   * Get grid column class based on field config
   */
  getColumnClass(field: FilterFieldConfig): string {
    const colSpan = field.colSpan ?? 1;
    if (colSpan === 2) return "col-span-2";
    return "col-span-1";
  }

  /**
   * Handle select change for select fields
   */
  onSelectChange(field: FilterFieldConfig, value: any): void {
    let processedValue = value;

    // Handle empty string for clearable selects
    if (value === "" || value === null) {
      processedValue = null;
    } else if (field.type === "select") {
      // Convert to number if the first option is a number
      const firstOption = field.options?.[0];
      if (firstOption && typeof firstOption.id === "number") {
        processedValue = value !== "" ? +value : null;
      }
    }

    this.updateFilterValue(field.key, processedValue);
  }

  /**
   * Handle multi select change
   */
  onMultiSelectChange(field: FilterFieldConfig, value: any): void {
    let processedValue = value;

    // Handle array values
    if (Array.isArray(value)) {
      // Check if options are numbers
      const firstOption = field.options?.[0];
      if (firstOption && typeof firstOption.id === "number") {
        processedValue = value.map((v: any) => +v);
      }
    } else if (!value || value === "") {
      processedValue = [];
    }

    this.updateFilterValue(field.key, processedValue);
  }

  /**
   * Get clear button text
   */
  getClearButtonText(): string {
    return this.config?.clearButtonText ?? "Temizle";
  }

  /**
   * Get apply button text
   */
  getApplyButtonText(): string {
    return this.config?.applyButtonText ?? "Filtrele";
  }

  /**
   * Track by function for field rendering
   */
  trackByKey(index: number, field: FilterFieldConfig): string {
    return field.key;
  }

  /**
   * Get active filter count
   */
  getActiveFilterCount(): number {
    const values = this.filterValues();
    let count = 0;

    Object.keys(values).forEach((key) => {
      const value = values[key];

      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          count++;
        } else if (!Array.isArray(value)) {
          count++;
        }
      }
    });

    return count;
  }

  /**
   * Generate unique element ID for a field
   */
  getFieldElementId(field: FilterFieldConfig): string {
    return `filter-${field.key}`;
  }

  /**
   * Register select element ID for cleanup
   */
  private registerSelectElement(elementId: string): void {
    this.selectElementIds.add(elementId);
  }

  /**
   * Cleanup - destroy all KT Select instances
   */
  ngOnDestroy(): void {
    // Destroy all registered KT Select instances
    if (this.selectElementIds.size > 0) {
      this.ktSelectService.destroyInstances(
        ...Array.from(this.selectElementIds),
      );
    }
  }
}
