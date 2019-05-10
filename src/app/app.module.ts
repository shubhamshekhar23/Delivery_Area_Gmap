import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { GmapComponent } from './gmap/gmap.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [BrowserModule, FormsModule,HttpClientModule,
  ],
  declarations: [AppComponent, HelloComponent, GmapComponent],
  bootstrap: [AppComponent],
})
export class AppModule { }
