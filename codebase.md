# app-shell.component.html

```html
<div class="shell">
  <header class="shell__header">
    <app-header></app-header>
  </header>

  <aside class="shell__sidebar">
    <app-sidebar></app-sidebar>
  </aside>

  <main class="shell__main">
    <router-outlet></router-outlet>
  </main>

  <footer class="shell__footer">
    <app-footer></app-footer>
  </footer>
</div>

```

# app-shell.component.scss

```scss
:host {
  display: grid;
  grid-template-rows: auto 1fr auto; /* header, main content, footer */
  grid-template-columns: 250px 1fr; /* sidebar and content */
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  height: 100vh;
}

.shell__header {
  grid-area: header;
}

.shell__sidebar {
  grid-area: sidebar;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
}

.shell__main {
  grid-area: main;
  overflow-y: auto;
  padding: 1rem 2rem;
}

.shell__footer {
  grid-area: footer;
  border-top: 1px solid #e0e0e0;
  padding: 1rem;
  text-align: center;
  background-color: #f8f9fa;
}
```

# app-shell.component.spec.ts

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppShellComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an app-header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBe(null);
  });

  it('should have an app-sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).not.toBe(null);
  });

  it('should have an app-footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-footer')).not.toBe(null);
  });

  it('should have a router-outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBe(null);
  });
});
```

# app-shell.component.ts

```ts
import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, RouterOutlet, FooterComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent {}
```

# footer/footer.component.html

```html
<p>© {{ currentYear }} My App. All rights reserved.</p>
```

# footer/footer.component.scss

```scss
p {
  margin: 0;
}
```

# footer/footer.component.spec.ts

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FooterComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

# footer/footer.component.ts

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
```

# header/header.component.html

```html
<h1>My App</h1>
<!-- Navigation Links -->
<nav>
  <a routerLink="/home">Home</a>
</nav>
```

# header/header.component.scss

```scss
h1 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
}
nav a {
  margin: 0 1rem;
  color: white;
  text-decoration: none;
}
```

# header/header.component.spec.ts

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

# header/header.component.ts

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {}
```

# sidebar/sidebar.component.html

```html
<!-- src/app/sidebar.component.html -->
<h2>Sidebar</h2>
<!-- Sidebar Links -->
<ul></ul>
```

# sidebar/sidebar.component.scss

```scss
h2 {
  margin-bottom: 1rem;
}
ul {
  list-style: none;
  padding: 0;
}
ul li {
  margin-bottom: 0.5rem;
}
```

# sidebar/sidebar.component.spec.ts

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

# sidebar/sidebar.component.ts

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {}
```

