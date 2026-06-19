import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { CartService } from './services/cart.service';
import { signal } from '@angular/core';

describe('App', () => {
  const authServiceMock = {
    isAuthenticated: () => false,
    currentUser: () => null,
    logout: () => {},
    setTenantId: () => {}
  };

  const cartServiceMock = {
    cartCount: signal(0),
    cart: signal([]),
    cartSubtotal: signal(0),
    clearCart: () => {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: CartService, useValue: cartServiceMock }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render brand title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-text')?.textContent).toContain(
      'SK47 MENS WEAR'
    );
  });
});
