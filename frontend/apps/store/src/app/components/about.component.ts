import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-container">
      <h2>About SK47 Mens Wear</h2>
      <p class="about-subtitle">THE ART OF TAILORING</p>
      <div class="divider"></div>
      <p class="about-text">
        Established with a commitment to excellence, SK47 Mens Wear offers luxury craftsmanship, 
        premium fabrics, and timeless style. From handcrafted shirts and high-grade stretch denim 
        to exquisite Italian wool blazers, our collections are meticulously tailored for the modern gentleman.
      </p>
    </div>
  `,
  styles: [`
    .about-container {
      max-width: 800px;
      margin: 80px auto;
      padding: 40px 24px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      text-align: center;
      font-family: 'Outfit', sans-serif;
    }
    h2 {
      font-size: 32px;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .about-subtitle {
      font-size: 14px;
      letter-spacing: 3px;
      color: #c5a880;
      font-weight: 600;
    }
    .divider {
      width: 60px;
      height: 2px;
      background-color: #c5a880;
      margin: 24px auto;
    }
    .about-text {
      font-size: 16px;
      line-height: 1.8;
      color: #64748b;
    }
  `]
})
export class AboutComponent {}
