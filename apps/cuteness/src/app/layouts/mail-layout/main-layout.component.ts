import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { filter } from 'rxjs';
import { MainLayoutHeaderService } from './main-layout-header.service';

@Component({
    selector: 'cuteness-main-layout',
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MainLayoutComponent implements OnInit {
  public modules = ['Fractal', 'TSP', 'Solar System'];

  @ViewChild('nav')
  private sideNav?: MatSidenav;

  protected info$ = this.mainLayoutHeaderService.getHeaderInfo();

  constructor(
    private readonly router: Router,
    private readonly mainLayoutHeaderService: MainLayoutHeaderService,
  ) {}

  public ngOnInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.sideNav?.close();
      this.mainLayoutHeaderService.setHeaderInfo({});
    });
  }

  protected getRoute(name: string): string {
    return name.toLowerCase().replace(' ', '-');
  }
}
