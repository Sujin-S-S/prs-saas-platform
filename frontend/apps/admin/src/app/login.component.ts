import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  isSignup = false;

  route = inject(Router);

  toggleForm() {
    this.isSignup = !this.isSignup;
  }

  login() {
    this.route.navigate(['/dashboard']);
  }

}