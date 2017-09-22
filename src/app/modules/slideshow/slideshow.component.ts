import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2,
  ViewChild
} from '@angular/core';
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
  private urlCache: string[];
  private autoplayIntervalId: any;

  @Input() imageUrls: string[];
  @Input() height: string;
  @Input() autoPlay: boolean = false;
  @Input() autoPlayInterval: number = 3333;
  @Input() stopAutoPlayOnSlide = true;

  @Output('onSlideLeft') public onSlideLeft = new EventEmitter<number>();
  @Output('onSlideRight') public onSlideRight = new EventEmitter<number>();
  @Output('onSwipeLeft') public onSwipeLeft = new EventEmitter<number>();
  @Output('onSwipeRight') public onSwipeRight = new EventEmitter<number>();

  @ViewChild('container') container: ElementRef;

  constructor(
    private swipeService: SwipeService,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.urlCache = this.imageUrls;
    this.setSlides(true);
    this.setHeight();
    this.handleAutoPlay();
  }

  ngOnChanges() {
    this.setSlides(false);
    this.setHeight();
    this.handleAutoPlay();
  }

  setSlides(initial: boolean): void {
    if(initial === true || this.urlCache !== this.imageUrls) {
      this.urlCache = this.imageUrls;
      this.slides = [];
      for (let url of this.imageUrls)
        this.slides.push({
          url: url,
          action: '',
          leftSide: false,
          rightSide: false,
          selected: false
        });
      this.slides[this.slideIndex].selected = true;
    }
  }

  onSlide(indexDirection: number, isSwipe?: boolean): void {
    this.handleAutoPlay(this.stopAutoPlayOnSlide);
    this.slide(indexDirection, isSwipe);
  }

  slide(indexDirection: number, isSwipe?: boolean): void {
    const oldIndex = this.slideIndex;
    this.setSlideIndex(indexDirection);

    if(indexDirection === 1) this.slideRight(oldIndex,isSwipe);
    else this.slideLeft(oldIndex, isSwipe);
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

  slideLeft(oldIndex: number, isSwipe?: boolean): void {
    if(isSwipe === true) this.onSwipeLeft.emit(this.slideIndex);
    else this.onSlideLeft.emit(this.slideIndex);
    this.slides[this.getLeftSideIndex(oldIndex)].leftSide = false;
    this.slides[oldIndex].leftSide = true;
    this.slides[oldIndex].action = 'slideOutLeft';
    this.slides[this.slideIndex].rightSide = false;
    this.slides[this.getRightSideIndex()].rightSide = true;
    this.slides[this.slideIndex].action = 'slideInRight';
  }

  slideRight(oldIndex: number, isSwipe?: boolean): void {
    if(isSwipe === true) this.onSwipeRight.emit(this.slideIndex);
    else this.onSlideRight.emit(this.slideIndex);
    this.slides[this.getRightSideIndex(oldIndex)].rightSide = false;
    this.slides[oldIndex].rightSide = true;
    this.slides[oldIndex].action = 'slideOutRight';
    this.slides[this.slideIndex].leftSide = false;
    this.slides[this.getLeftSideIndex()].leftSide = true;
    this.slides[this.slideIndex].action = 'slideInLeft';
  }

  detectSwipe(e: TouchEvent, when: string): void {
    const indexDirection = this.swipeService.swipe(e, when);
    // handle a failed swipe
    if(indexDirection === 0) return;
    else this.onSlide(indexDirection, true);
  }

  setHeight(): void {
    if(!isNullOrUndefined(this.height)) this.renderer.setStyle(this.container.nativeElement, 'height', this.height);
  }

  handleAutoPlay(stopAutoPlay?: boolean): void {
    if (stopAutoPlay === true || this.autoPlay === false) clearInterval(this.autoplayIntervalId);
    else if(isNullOrUndefined(this.autoplayIntervalId))
      this.autoplayIntervalId = setInterval(() => {
      this.slide(1);
    }, this.autoPlayInterval);
  }
}
