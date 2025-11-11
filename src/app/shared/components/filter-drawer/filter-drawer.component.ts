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
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  FilterDrawerConfig,
  FilterFieldConfig,
  FilterValues,
} from "./filter-config.interface";
import { MetronicInitService } from "../../../core/services/metronic-init.service";

@Component({
  selector: "app-filter-drawer",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./filter-drawer.component.html",
  styleUrls: ["./filter-drawer.component.scss"],
})
export class FilterDrawerComponent implements OnInit, AfterViewChecked {
  private metronicInit = inject(MetronicInitService);

  /** Filter configuration */
  @Input() config!: FilterDrawerConfig;

  /** Drawer ID for toggle */
  @Input() drawerId: string = "filter_drawer";

  /** Initial filter values */
  @Input() initialValues: FilterValues = {};

  /** Emits when filters are applied */
  @Output() filtersApplied = new EventEmitter<FilterValues>();

  /** Emits when filters are cleared */
  @Output() filtersCleared = new EventEmitter<void>();

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
  }

  ngOnInit(): void {
    this.initializeFilterValues();

    // Initialize select components after a short delay
    setTimeout(() => {
      this.metronicInit.initSelect();
    }, 100);
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
   * Apply filters
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
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.initializeFilterValues();
    this.filtersCleared.emit();
    this.needsSelectInit = true;
  }

  /**
   * Get grid column class based on field config
   */
  getColumnClass(field: FilterFieldConfig): string {
    const colSpan = field.colSpan ?? 1;
    return colSpan === 2 ? "col-span-2" : "col-span-1";
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
}
