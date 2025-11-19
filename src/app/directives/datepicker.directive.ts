import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  forwardRef,
  Output,
  EventEmitter,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import flatpickr from "flatpickr";
import { Turkish } from "flatpickr/dist/l10n/tr.js";
import type { Instance } from "flatpickr/dist/types/instance";

@Directive({
  selector: "[appDatepicker]",
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerDirective),
      multi: true,
    },
  ],
})
export class DatepickerDirective
  implements OnInit, OnDestroy, ControlValueAccessor
{
  @Input() dateFormat: string = "Y-m-d"; // ISO format by default
  @Input() altFormat: string = "d.m.Y"; // Display format (Turkish style)
  @Input() minDate: string | Date | null = null;
  @Input() maxDate: string | Date | null = null;
  @Input() enableTime: boolean = false;
  @Input() mode: "single" | "multiple" | "range" = "single";

  @Output() dateChange = new EventEmitter<string | null>();

  private flatpickrInstance: Instance | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initFlatpickr();
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }

  private initFlatpickr() {
    const options: any = {
      dateFormat: this.dateFormat,
      altInput: true,
      altFormat: this.altFormat,
      locale: Turkish,
      allowInput: true,
      mode: this.mode,
      enableTime: this.enableTime,
      onChange: (selectedDates: Date[], dateStr: string) => {
        const value = dateStr || null;
        this.onChange(value);
        this.dateChange.emit(value);
      },
      onClose: () => {
        this.onTouched();
      },
    };

    if (this.minDate) {
      options.minDate = this.minDate;
    }

    if (this.maxDate) {
      options.maxDate = this.maxDate;
    }

    this.flatpickrInstance = flatpickr(this.el.nativeElement, options);
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    if (this.flatpickrInstance) {
      if (value) {
        this.flatpickrInstance.setDate(value, false);
      } else {
        this.flatpickrInstance.clear();
      }
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.flatpickrInstance) {
      if (isDisabled) {
        this.flatpickrInstance.set("clickOpens", false);
        this.el.nativeElement.disabled = true;
      } else {
        this.flatpickrInstance.set("clickOpens", true);
        this.el.nativeElement.disabled = false;
      }
    }
  }
}
