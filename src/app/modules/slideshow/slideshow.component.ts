import {Component, ElementRef, Input, OnChanges, OnInit, Renderer2, ViewChild} from '@angular/core';
import {SwipeService} from './swipe.service';
import {isNullOrUndefined, isUndefined} from 'util';

@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit, OnChanges {
  public slideIndex: number = 0;
  public slides: {url: string, action: string, leftSide: boolean, rightSide: boolean, selected: boolean}[] = [];
  @Input() imageUrls: string[];
  @Input() height: string;
  @ViewChild('container') container: ElementRef;
  private urlCache: string[];

  constructor(
    private swipeService: SwipeService,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.urlCache = this.imageUrls;
    this.setSlides(true);
    this.setHeight();
  }

  ngOnChanges() {
    this.setSlides(false);
    this.setHeight();
  }

  setSlides(initial: boolean): void {
    if(initial || this.urlCache !== this.imageUrls) {
      for (let url of this.imageUrls) this.slides.push({
        url: url,
        action: '',
        leftSide: false,
        rightSide: false,
        selected: false
      });
      this.slides[this.slideIndex].selected = true;
      this.urlCache = this.imageUrls;
    }
  }

  slide(indexDirection: number): void {
    // handle a failed swipe
    if(indexDirection === 0) return;
    const oldIndex = this.slideIndex;
    this.setSlideIndex(indexDirection);

    if(indexDirection === 1) this.slideRight(oldIndex);
    else this.slideLeft(oldIndex);
    this.slides[oldIndex].selected = false;
    this.slides[this.slideIndex].selected = true;
  }

  setSlideIndex(indexDirection: number): void {
    this.slideIndex += indexDirection;
    if(this.slideIndex < 0) this.slideIndex = this.slides.length - 1;
    if(this.slideIndex >= this.slides.length) this.slideIndex = 0;
  }

  getLeftSideIndex(i?: number): number {
    if(isUndefined(i)) i = this.slideIndex;
    if(--i < 0) i = this.slides.length - 1;
    return i;
  }

  getRightSideIndex(i?: number): number {
    if(isUndefined(i)) i = this.slideIndex;
    if(++i >= this.slides.length) i = 0;
    return i;
  }

  slideLeft(oldIndex: number): void {
    this.slides[this.getLeftSideIndex(oldIndex)].leftSide = false;
    this.slides[oldIndex].leftSide = true;
    this.slides[oldIndex].action = 'slideOutLeft';
    this.slides[this.slideIndex].rightSide = false;
    this.slides[this.getRightSideIndex()].rightSide = true;
    this.slides[this.slideIndex].action = 'slideInRight';
  }

  slideRight(oldIndex: number): void {
    this.slides[this.getRightSideIndex(oldIndex)].rightSide = false;
    this.slides[oldIndex].rightSide = true;
    this.slides[oldIndex].action = 'slideOutRight';
    this.slides[this.slideIndex].leftSide = false;
    this.slides[this.getLeftSideIndex()].leftSide = true;
    this.slides[this.slideIndex].action = 'slideInLeft';
  }

  detectSwipe(e: TouchEvent, when: string): void {
    this.slide(this.swipeService.swipe(e, when));
  }

  setHeight(): void {
    if(!isNullOrUndefined(this.height)) this.renderer.setStyle(this.container.nativeElement, 'height', this.height);
  }
}
