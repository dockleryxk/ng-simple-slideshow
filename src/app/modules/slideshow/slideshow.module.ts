import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlideshowComponent } from './slideshow.component';
import { SwipeService } from './swipe.service';
import { BrowserTransferStateModule } from '@angular/platform-browser';

@NgModule({
  imports: [
    CommonModule,
    BrowserTransferStateModule
  ],
  declarations: [
    SlideshowComponent
  ],
  exports: [
    SlideshowComponent
  ],
  providers: [
    SwipeService
  ]
})
export class SlideshowModule { }
