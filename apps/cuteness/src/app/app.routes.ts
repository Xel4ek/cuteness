import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { WelcomeComponent } from './components/welcome/welcome.component';

const routes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: WelcomeComponent,
  },
  {
    path: 'fractal',
    title: 'Fractal',
    loadComponent: () => import('./components/fractal/fractal.component'),
  },
  {
    path: 'tsp',
    loadChildren: () => import('./components/graph-algorithms/graph-algorithms.component'),
  },
  {
    path: 'solar-system',
    title: 'Solar system',
    loadComponent: () => import('./components/solar-system/solar-system.component'),
  },
  {
    path: 'opfs',
    title: 'File storage',
    loadComponent: () => import('./components/opfs/opfs.component'),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
