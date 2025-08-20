import { Component, HostBinding, AfterViewInit, inject } from '@angular/core';
import { MetronicInitService } from '../../core/services/metronic-init.service';

@Component({
  selector: 'app-login',
  imports: [],
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