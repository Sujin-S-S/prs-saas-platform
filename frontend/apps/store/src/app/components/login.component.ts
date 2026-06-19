import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { NotificationService } from '@frontend/shared';
import { LoaderComponent } from '@frontend/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  auth = inject(AuthService);
  notifier = inject(NotificationService);
  router = inject(Router);

  isLoading = signal(false);
  loaderMessage = signal('');

  email = '';
  password = '';
  showPassword = signal(false);

  isLoginMode = signal(true);

  // Registration fields
  regFirstName = '';
  regLastName = '';
  regEmail = '';
  regPassword = '';
  regPhone = '';

  constructor() {
    this.auth.setTenantId('sk47'); // Default to SK47 storefront
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleMode(): void {
    this.isLoginMode.update(m => !m);
  }

  onRegister(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Creating customer account...');

    const payload = {
      firstName: this.regFirstName,
      lastName: this.regLastName,
      email: this.regEmail,
      password: this.regPassword,
      phone: this.regPhone || undefined
    };

    this.auth.registerCustomer(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notifier.success('Account created successfully! Please sign in.');
        this.email = this.regEmail;
        this.password = '';
        this.isLoginMode.set(true);
        // Reset fields
        this.regFirstName = '';
        this.regLastName = '';
        this.regEmail = '';
        this.regPassword = '';
        this.regPhone = '';
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Registration failed. Please verify your details.');
      }
    });
  }

  onLogin(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Authenticating account...');

    this.auth.loginCustomer(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notifier.success('Logged in successfully to SK47 storefront!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }
}
