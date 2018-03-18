import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { SlideshowModule } from '../../public_api';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SlideshowModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
