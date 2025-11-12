import { Injectable } from '@angular/core';

declare const KTSelect: any;

/**
 * KT Select Service - Metronic KT Select bileşenlerini yönetmek için servis
 *
 * Bu servis KT Select ve KT Multiselect bileşenlerinin instance'larını oluşturur,
 * yönetir ve temizler. Tekrar kullanılabilir metodlar sağlar.
 */
@Injectable({
  providedIn: 'root'
})
export class KTSelectService {

  /**
   * KT Select instance'ını al veya oluştur
   * @param elementId - Select elementinin ID'si
   * @returns KTSelect instance veya null
   */
  getOrCreateInstance(elementId: string): any {
    const element = document.getElementById(elementId);

    if (!element) {
      console.error(`[KTSelectService] Element with id '${elementId}' not found`);
      return null;
    }

    if (typeof KTSelect === 'undefined') {
      console.error('[KTSelectService] KTSelect is not defined. Make sure Metronic assets are loaded.');
      return null;
    }

    // Eğer zaten instance varsa onu döndür
    if ((element as any)['instance']) {
      return (element as any)['instance'];
    }

    // Yoksa yeni instance oluştur
    try {
      return new KTSelect(element);
    } catch (error) {
      console.error(`[KTSelectService] Error creating KTSelect instance for '${elementId}':`, error);
      return null;
    }
  }

  /**
   * Select'i temizle (API metodu)
   * @param elementId - Select elementinin ID'si
   */
  clearSelection(elementId: string): void {
    const instance = this.getOrCreateInstance(elementId);

    if (instance && typeof instance.clearSelection === 'function') {
      instance.clearSelection();
    }
  }

  /**
   * Belirli değerleri seç
   * @param elementId - Select elementinin ID'si
   * @param values - Seçilecek değerler array'i
   */
  setSelectedOptions(elementId: string, values: any[]): void {
    const instance = this.getOrCreateInstance(elementId);

    if (instance && typeof instance.setSelectedOptions === 'function') {
      instance.setSelectedOptions(values);
    }
  }

  /**
   * Manuel deep clear - clearSelection() bug'ı varsa kullan
   * Native select elementi ve KT Select internal state'ini tamamen temizler
   * @param elementId - Select elementinin ID'si
   */
  manualClearSelection(elementId: string): void {
    const selectEl = document.getElementById(elementId) as HTMLSelectElement;

    if (!selectEl) {
      console.error(`[KTSelectService] Element with id '${elementId}' not found for manual clear`);
      return;
    }

    const instance = (selectEl as any)['instance'];

    if (instance) {
      // KTSelect internal state'i temizle
      if (instance._state) {
        instance._state._selectedOptions = [];
      }

      // CSS sınıflarını temizle
      if (instance._options) {
        instance._options.forEach((opt: any) => opt.classList.remove('selected'));
      }

      // Display elementini sıfırla
      if (instance._displayElement) {
        instance._displayElement.setAttribute('data-selected', '0');
        const placeholder = instance._config?.placeholder || '-- Seçim Yapın --';
        instance._displayElement.innerHTML = placeholder;
      }
    }

    // Native select elementini sıfırla
    Array.from(selectEl.options).forEach(opt => {
      opt.selected = false;
    });
    selectEl.value = '';

    // Change event'ini tetikle
    const event = new Event('change', { bubbles: true });
    selectEl.dispatchEvent(event);
  }

  /**
   * Select'i temizle ve change event'ini tetikle
   * @param elementId - Select elementinin ID'si
   */
  clearSelectionWithEvent(elementId: string): void {
    const selectEl = document.getElementById(elementId);
    const instance = this.getOrCreateInstance(elementId);

    if (instance && typeof instance.clearSelection === 'function') {
      instance.clearSelection();
    }

    // Manuel change event tetikle
    if (selectEl) {
      const event = new Event('change', { bubbles: true });
      selectEl.dispatchEvent(event);
    }
  }

  /**
   * Select'i temizle ve native select ile senkronize et
   * clearSelection() native elementi temizlemiyorsa bu metodu kullan
   * @param elementId - Select elementinin ID'si
   */
  clearSelectionWithSync(elementId: string): void {
    const selectEl = document.getElementById(elementId) as HTMLSelectElement;
    const instance = this.getOrCreateInstance(elementId);

    // KT Select API ile temizle
    if (instance && typeof instance.clearSelection === 'function') {
      instance.clearSelection();
    }

    // Native elementi de manuel temizle
    if (selectEl) {
      selectEl.value = '';
      Array.from(selectEl.options).forEach(opt => {
        opt.selected = false;
      });

      // Change event'ini tetikle
      const event = new Event('change', { bubbles: true });
      selectEl.dispatchEvent(event);
    }
  }

  /**
   * Tüm select instance'larını yok et (component destroy'da kullan)
   * @param elementIds - Temizlenecek element ID'leri
   */
  destroyInstances(...elementIds: string[]): void {
    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element && (element as any)['instance']) {
        const instance = (element as any)['instance'];

        // Eğer destroy metodu varsa kullan
        if (typeof instance.destroy === 'function') {
          instance.destroy();
        }

        // Instance referansını temizle
        (element as any)['instance'] = null;
      }
    });
  }

  /**
   * Multi-select için seçili değerleri al
   * @param elementId - Select elementinin ID'si
   * @returns Seçili değerler array'i
   */
  getSelectedValues(elementId: string): any[] {
    const selectEl = document.getElementById(elementId) as HTMLSelectElement;

    if (!selectEl) {
      return [];
    }

    const selectedOptions = Array.from(selectEl.selectedOptions || []);
    return selectedOptions.map(opt => opt.value);
  }

  /**
   * Instance'ın var olup olmadığını kontrol et
   * @param elementId - Select elementinin ID'si
   * @returns Instance var mı?
   */
  hasInstance(elementId: string): boolean {
    const element = document.getElementById(elementId);
    return !!(element && (element as any)['instance']);
  }
}
