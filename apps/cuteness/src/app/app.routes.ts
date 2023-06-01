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
    path: 'ant',
    loadChildren: () => import('./components/ant-colony/ant-colony.component'),
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