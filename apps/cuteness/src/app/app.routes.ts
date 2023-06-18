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
    loadChildren: () => import('./components/fractal/fractal.component'),
  },
  {
    path: 'tsp',
    loadChildren: () => import('./components/graph-algorithms/graph-algorithms.component'),
  },
  {
    path: 'crypto',
    loadChildren: () => import('./modules/rsa/rsa.module').then(m => m.RSAModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: false,
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
