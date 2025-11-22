import { Directive, ElementRef, HostListener } from "@angular/core";

@Directive({
  selector: "[appPhoneMask]",
  standalone: true,
})
export class PhoneMaskDirective {
  private previousValue: string = "";

  constructor(private el: ElementRef) {}

  @HostListener("input", ["$event"])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ""); // Sadece rakamları al

    // Maksimum 11 rakam (Türkiye telefon formatı için)
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    // Formatla: 0XXX XXX XX XX
    let formattedValue = "";
    if (value.length > 0) {
      formattedValue = value.substring(0, 1); // 0
      if (value.length > 1) {
        formattedValue += value.substring(1, 4); // XXX
      }
      if (value.length > 4) {
        formattedValue += " " + value.substring(4, 7); // XXX
      }
      if (value.length > 7) {
        formattedValue += " " + value.substring(7, 9); // XX
      }
      if (value.length > 9) {
        formattedValue += " " + value.substring(9, 11); // XX
      }
    }

    // Değeri güncelle
    if (formattedValue !== input.value) {
      input.value = formattedValue;

      // Cursor pozisyonunu ayarla
      const cursorPosition = this.getCursorPosition(
        formattedValue,
        this.previousValue,
        input.selectionStart || 0,
      );
      input.setSelectionRange(cursorPosition, cursorPosition);
    }

    this.previousValue = formattedValue;
  }

  @HostListener("keydown", ["$event"])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // İzin verilen tuşlar: rakamlar, backspace, delete, ok tuşları, tab
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(key)) {
      return;
    }

    // Sadece rakamları kabul et
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  @HostListener("paste", ["$event"])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData("text") || "";
    const numbersOnly = pastedText.replace(/\D/g, "");

    const input = event.target as HTMLInputElement;

    // Maksimum 11 rakam
    let value = numbersOnly.substring(0, 11);

    // Formatla
    let formattedValue = "";
    if (value.length > 0) {
      formattedValue = value.substring(0, 1);
      if (value.length > 1) {
        formattedValue += value.substring(1, 4);
      }
      if (value.length > 4) {
        formattedValue += " " + value.substring(4, 7);
      }
      if (value.length > 7) {
        formattedValue += " " + value.substring(7, 9);
      }
      if (value.length > 9) {
        formattedValue += " " + value.substring(9, 11);
      }
    }

    input.value = formattedValue;
    this.previousValue = formattedValue;
  }

  private getCursorPosition(
    newValue: string,
    oldValue: string,
    currentPosition: number,
  ): number {
    // Boşluk eklenmişse cursor'u bir ileri al
    if (
      newValue.length > oldValue.length &&
      newValue[currentPosition] === " "
    ) {
      return currentPosition + 1;
    }
    return currentPosition;
  }
}
