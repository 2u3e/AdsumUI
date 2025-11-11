/**
 * Filter field configuration interface
 */
export interface FilterFieldConfig {
  /** Unique key for the field */
  key: string;

  /** Display label */
  label: string;

  /** Field type */
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'switch' | 'radio' | 'date' | 'daterange';

  /** Placeholder text */
  placeholder?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Whether the field is searchable (for select/multiselect) */
  searchable?: boolean;

  /** Whether the field can be cleared */
  clearable?: boolean;

  /** Options for select/multiselect/radio */
  options?: Array<{ id: string | number; name: string }>;

  /** Default value */
  defaultValue?: any;

  /** Column span (1 or 2) */
  colSpan?: 1 | 2;
}

/**
 * Filter drawer configuration
 */
export interface FilterDrawerConfig {
  /** Drawer title */
  title?: string;

  /** Clear button text */
  clearButtonText?: string;

  /** Apply button text */
  applyButtonText?: string;

  /** Filter fields */
  fields: FilterFieldConfig[];
}

/**
 * Filter values type
 */
export interface FilterValues {
  [key: string]: any;
}
