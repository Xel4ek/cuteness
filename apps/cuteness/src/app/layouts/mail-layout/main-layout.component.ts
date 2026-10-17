import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { filter } from 'rxjs';
import { MainLayoutHeaderService } from './main-layout-header.service';

@Component({
  selector: 'cuteness-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MainLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly mainLayoutHeaderService = inject(MainLayoutHeaderService);
  private readonly destroyRef = inject(DestroyRef);

  public modules = ['Fractal', 'TSP', 'Solar System'];

  @ViewChild('nav')
  private sideNav?: MatSidenav;

  protected info$ = this.mainLayoutHeaderService.getHeaderInfo();
  protected readonly pageTitle = signal('Cuteness');

  public ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        this.pageTitle.set(route.title ?? 'Cuteness');
        this.sideNav?.close();
        this.mainLayoutHeaderService.setHeaderInfo({});
      });
  }

  protected getRoute(name: string): string {
    return name.toLowerCase().replace(' ', '-');
  }
}
