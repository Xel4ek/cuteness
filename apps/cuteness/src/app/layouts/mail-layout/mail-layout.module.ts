import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu } from '@ng-icons/lucide';
import { ZardButtonComponent, ZardSheetComponent } from '@cuteness/ui-kit';

import { MainLayoutComponent } from './main-layout.component';

@NgModule({
  declarations: [MainLayoutComponent],
  exports: [MainLayoutComponent],
  imports: [CommonModule, NgIcon, ZardButtonComponent, ZardSheetComponent, RouterOutlet, RouterLink, RouterLinkActive],
  providers: [provideIcons({ lucideMenu })],
})
export class MailLayoutModule {}
