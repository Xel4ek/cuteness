import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {AppRoutingModule} from "./app.routes";
import {MailLayoutModule} from "./layouts/mail-layout/mail-layout.module";
import { NgxGraphModule } from '@swimlane/ngx-graph';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MailLayoutModule,
    NgxGraphModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
