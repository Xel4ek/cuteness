import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RSAComponent } from './components/rsa/rsa.component';

const routes: Routes = [{
  path: '',
  component: RSAComponent,
}];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RSARoutingModule { }
