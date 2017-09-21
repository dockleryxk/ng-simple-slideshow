import {Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {SwipeService} from './swipe.service';
import {isNullOrUndefined, isUndefined} from 'util';

@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit {
  public slideIndex: number = 0;
  public slides: {url: string, action: string, leftSide: boolean, rightSide: boolean, selected: boolean}[] = [];
  @Input() imageUrls: string[];
  @Input() height: string;
  @ViewChild('container') container: ElementRef;

  constructor(
    private swipeService: SwipeService,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    for(let url of this.imageUrls) this.slides.push({url: url, action: '', leftSide: false, rightSide: false, selected: false});
    this.slides[this.slideIndex].selected = true;
    if(!isNullOrUndefined(this.height)) this.renderer.setStyle(this.container.nativeElement, 'height', this.height);
  }

  slide(indexDirection: number): void {
    if(indexDirection === 0) return;
    const oldIndex = this.slideIndex;
    this.slideIndex += indexDirection;
    if(this.slideIndex < 0) this.slideIndex = this.slides.length - 1;
    if(this.slideIndex >= this.slides.length) this.slideIndex = 0;

    if(indexDirection === 1) { // move to the right
      this.slides[this.getRightSide(oldIndex)].rightSide = false;
      this.slides[oldIndex].rightSide = true;
      this.slides[oldIndex].action = 'slideOutRight';
      this.slides[this.slideIndex].leftSide = false;
      this.slides[this.getLeftSide()].leftSide = true;
      this.slides[this.slideIndex].action = 'slideInLeft';
    }
    else { // move to the left
      this.slides[this.getLeftSide(oldIndex)].leftSide = false;
      this.slides[oldIndex].leftSide = true;
      this.slides[oldIndex].action = 'slideOutLeft';
      this.slides[this.slideIndex].rightSide = false;
      this.slides[this.getRightSide()].rightSide = true;
      this.slides[this.slideIndex].action = 'slideInRight';
    }

    this.slides[oldIndex].selected = false;
    this.slides[this.slideIndex].selected = true;
  }

  getLeftSide(i?: number): number {
    if(isUndefined(i)) i = this.slideIndex;
    if(--i < 0) i = this.slides.length - 1;
    return i;
  }

  getRightSide(i?: number): number {
    if(isUndefined(i)) i = this.slideIndex;
    if(++i >= this.slides.length) i = 0;
    return i;
  }

  detectSwipe(e: TouchEvent, when: string): void {
    this.slide(this.swipeService.swipe(e, when));
  }
}
