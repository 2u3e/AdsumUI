import { Component, HostBinding, AfterViewInit, inject } from '@angular/core';
import { ThemeToggleComponent } from '../../partials/theme-toggle/theme-toggle.component';
import { RouterOutlet } from '@angular/router';
import { MetronicInitService } from '../../core/services/metronic-init.service';

@Component({
  selector: 'app-login',
  imports: [RouterOutlet, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
  @HostBinding('class') class = 'flex grow';
  private metronicInitService = inject(MetronicInitService);

  ngAfterViewInit(): void {
    this.metronicInitService.init();
  }
}