import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact-container">
      <h2>Contact Us</h2>
      <p class="contact-subtitle">WE WOULD LOVE TO HEAR FROM YOU</p>
      <div class="divider"></div>
      
      <div class="contact-grid">
        <div class="contact-info">
          <h3>Visit Our Flagship Store</h3>
          <p><strong>Address:</strong> 789 Fashion Avenue, New York, NY 10018</p>
          <p><strong>Phone:</strong> +1 (212) 555-0147</p>
          <p><strong>Email:</strong> support&#64;sk47menswear.com</p>
          <p><strong>Hours:</strong> Mon - Sat: 10:00 AM - 8:00 PM | Sun: 11:00 AM - 6:00 PM</p>
        </div>
        
        <div class="contact-form-section">
          <h3>Send a Message</h3>
          <form class="contact-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <input type="text" placeholder="Your Name" required class="form-input">
            </div>
            <div class="form-group">
              <input type="email" placeholder="Email Address" required class="form-input">
            </div>
            <div class="form-group">
              <textarea placeholder="Your Message" rows="5" required class="form-input"></textarea>
            </div>
            <button type="submit" class="send-btn">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-container {
      max-width: 1000px;
      margin: 80px auto;
      padding: 40px 24px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      font-family: 'Outfit', sans-serif;
    }
    h2 {
      font-size: 32px;
      color: #1e293b;
      margin-bottom: 8px;
      text-align: center;
    }
    .contact-subtitle {
      font-size: 14px;
      letter-spacing: 3px;
      color: #c5a880;
      font-weight: 600;
      text-align: center;
    }
    .divider {
      width: 60px;
      height: 2px;
      background-color: #c5a880;
      margin: 24px auto 40px;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 48px;
    }
    @media (max-width: 768px) {
      .contact-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }
    .contact-info h3, .contact-form-section h3 {
      font-size: 20px;
      color: #1e293b;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .contact-info p {
      font-size: 15px;
      color: #64748b;
      line-height: 1.8;
      margin: 12px 0;
    }
    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group {
      width: 100%;
    }
    .form-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-input:focus {
      outline: none;
      border-color: #c5a880;
    }
    .send-btn {
      background: #1e293b;
      color: #ffffff;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .send-btn:hover {
      background: #0f172a;
    }
  `]
})
export class ContactComponent {
  onSubmit() {
    alert('Thank you! Your message has been sent.');
  }
}
