import { Component, ElementRef, EventEmitter, Inject, Input, Output, PLATFORM_ID, Renderer2, ViewChild, DoCheck, NgZone, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
// import { SwipeService } from './swipe.service';
import { isPlatformServer, DOCUMENT } from '@angular/common';
import { ISlide } from './ISlide';
import { IImage } from './IImage';
import { DomSanitizer, TransferState, makeStateKey, SafeStyle } from '@angular/platform-browser';
import { PointerService } from './pointer.service';
import { Subscription } from 'rxjs';

const FIRST_SLIDE_KEY = makeStateKey<any>('firstSlide');

@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss'],
  providers: [PointerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlideshowComponent implements OnInit, AfterViewInit, DoCheck, OnChanges, OnDestroy {
  slideIndex: number = -1;
  slides: ISlide[] = [];
  hideLeftArrow: boolean = false;
  hideRightArrow: boolean = false;
  private _urlCache: (string | IImage)[];
  private _autoplayIntervalId: any;
  private _initial: boolean = true;
  private _isHidden: boolean = false;
  private _slideSub: Subscription;
  private _clickSub: Subscription;

  @Input() imageUrls: (string | IImage)[] = [];
  @Input() height: string = '100%';
  @Input() minHeight: string;
  @Input() arrowSize: string;
  @Input() showArrows: boolean = true;
  @Input() disableSwiping: boolean = false;
  @Input() autoPlay: boolean = false;
  @Input() autoPlayInterval: number = 3333;
  @Input() autoPlayTransition: string = 'slide';
  @Input() stopAutoPlayOnSlide: boolean = true;
  @Input() autoPlayWaitForLazyLoad: boolean = true;
  @Input() debug: boolean;
  @Input() backgroundSize: string = 'cover';
  @Input() backgroundPosition: string = 'center center';
  @Input() backgroundRepeat: string = 'no-repeat';
  @Input() showDots: boolean = false;
  @Input() dotColor: string = '#FFF';
  @Input() showCaptions: boolean = true;
  @Input() captionColor: string = '#FFF';
  @Input() captionBackground: string = 'rgba(0, 0, 0, .35)';
  @Input() lazyLoad: boolean = false;
  @Input() hideOnNoSlides: boolean = false;
  @Input() fullscreen: boolean = false;
  @Input() enableZoom: boolean = false;
  @Input() enablePan: boolean = false;
  @Input() noLoop: boolean = false;

  @Output() onSlideLeft = new EventEmitter<number>();
  @Output() onSlideRight = new EventEmitter<number>();
  @Output() onSwipeLeft = new EventEmitter<number>();
  @Output() onSwipeRight = new EventEmitter<number>();
  @Output() onFullscreenExit = new EventEmitter<boolean>();
  @Output() onIndexChanged = new EventEmitter<number>();
  @Output() onImageLazyLoad = new EventEmitter<ISlide>();
  @Output() onClick = new EventEmitter<{ slide: ISlide, index: number }>();

  @ViewChild('container') container: ElementRef;
  @ViewChild('prevArrow') prevArrow: ElementRef;
  @ViewChild('nextArrow') nextArrow: ElementRef;

  get safeStyleDotColor(): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`--dot-color: ${ this.dotColor }`);
  }

  constructor(
    private _pointerService: PointerService,
    private _renderer: Renderer2,
    private _transferState: TransferState,
    private _ngZone: NgZone,
    private _cdRef: ChangeDetectorRef,
    public sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platform_id: any,
    @Inject(DOCUMENT) private document: any
  ) { }

  ngOnInit() {
    if (this.debug !== undefined) {
      console.warn('[Deprecation Warning]: The debug input will be removed from ng-simple-slideshow in 1.3.0');
    }
    this._slideSub = this._pointerService.slideEvent.subscribe((indexDirection: number) => {
      this.onSlide(indexDirection, true);
    });
    this._clickSub = this._pointerService.clickEvent.subscribe(() => {
      this._onClick();
    });
    if (this.noLoop) {
      this.hideLeftArrow = true;
    }
  }

  ngAfterViewInit(): void {
    this._pointerService.bind(this.container);
  }

  ngOnDestroy() {
    try {
      if (this._slideSub && !this._slideSub.closed) {
        this._slideSub.unsubscribe();
      }
    }
    catch (error) {
      console.warn('Slide Subscription error caught in ng-simple-slideshow OnDestroy:', error);
    }

    try {
      if (this._clickSub && !this._clickSub.closed) {
        this._clickSub.unsubscribe();
      }
    }
    catch (error) {
      console.warn('Click Subscription error caught in ng-simple-slideshow OnDestroy:', error);
    }

    try {
      this._pointerService.unbind(this.container);
    }
    catch (error) {
      console.warn('Pointer Service unbind error caught in ng-simple-slideshow OnDestroy:', error);
    }

    try {
      if (this._autoplayIntervalId) {
        this._ngZone.runOutsideAngular(() => clearInterval(this._autoplayIntervalId));
        this._autoplayIntervalId = null;
      }
    }
    catch (error) {
      console.warn('Autoplay cancel error caught in ng-simple-slideshow OnDestroy:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['noLoop']) {
      if (changes['noLoop'].currentValue) {
        this.hideLeftArrow = this.slideIndex <= 0;
        this.hideRightArrow = this.slideIndex === this.slides.length - 1;
      }
      else {
        this.hideLeftArrow = false;
        this.hideRightArrow = false;
      }

      this._cdRef.detectChanges();
    }
  }

  ngDoCheck() {
    // if this is the first being called, create a copy of the input
    if (this.imageUrls && this.imageUrls.length > 0) {
      if (this._initial === true) {
        this._urlCache = Array.from(this.imageUrls);
      }

      if (this._isHidden === true) {
        this._renderer.removeStyle(this.container.nativeElement, 'display');
        this._isHidden = false;
      }

      this.setSlides();
    }
    else if (this.hideOnNoSlides === true) {
      this._renderer.setStyle(this.container.nativeElement, 'display', 'none');
      this._isHidden = true;
    }

    this.setStyles();
    this.handleAutoPlay();
    this._pointerService.disableSwiping = this.disableSwiping;
    this._pointerService.enableZoom = this.enableZoom;
    this._pointerService.enablePan = this.enablePan;
  }

  /**
   * @param {number} indexDirection
   * @param {boolean} isSwipe
   * @description this is the function that should be called to make the slides change.
   *              indexDirection to move back is -1, to move forward is 1, and to stay in place is 0.
   *              0 is taken into account for failed swipes
   */
  onSlide(indexDirection: number, isSwipe?: boolean): void {
    this.handleAutoPlay(this.stopAutoPlayOnSlide);
    this.slide(indexDirection, isSwipe);
  }

  /**
   * @description Redirect to current slide "href" if defined
   */
  private _onClick(): void {
    const currentSlide = this.slides.length > 0 && this.slides[this.slideIndex];
    this.onClick.emit({ slide: currentSlide, index: this.slideIndex });

    if (currentSlide && currentSlide.image.clickAction) {
      currentSlide.image.clickAction();
    }
    else if (currentSlide && currentSlide.image.href) {
      this.document.location.href = currentSlide.image.href;
    }
  }

  /**
   * @param {number} index
   * @description manual selection of a slide - handle AutoPlay and perform Slide
   */
  goToSlide(index: number) {
    this.handleAutoPlay(this.stopAutoPlayOnSlide);
    this.performSlideAction(index);
  }

  private resetAllSlides() {
    for (let i=0; i < this.slides.length; i++) {
      this.slides[i] = { ...this.slides[i], action: '', leftSide: false, rightSide: false, selected: false };
    }
  }
  /**
   * @param {newSlideIndex} index
   * @description prepare everything for the next slide animation and then run animation
   */
  private performSlideAction(newSlideIndex: number) {
    const oldSlideIndex = this.slideIndex;
    this.slideIndex = newSlideIndex % this.slides.length;
    if (this.slideIndex < 0) {
      this.slideIndex = this.slideIndex + this.slides.length;
    }

    // always pre-load this slide plus next slide.
    this.loadSlide(this.slideIndex);
    this.loadSlide(this.slideIndex + 1);

    this.resetAllSlides();

    if (oldSlideIndex < this.slideIndex) {
      this.slides[oldSlideIndex] = { ...this.slides[oldSlideIndex], action: 'slideOutRight', rightSide: true };
      this.slides[this.slideIndex] = { ...this.slides[this.slideIndex], action: 'slideInLeft', selected: true };
    } else {
      this.slides[oldSlideIndex] = { ...this.slides[oldSlideIndex], action: 'slideOutLeft', leftSide: true };
      this.slides[this.slideIndex] = { ...this.slides[this.slideIndex], action: 'slideInRight', selected: true };
    }

    this._cdRef.detectChanges();
  }

  /**
   * @param {newSlideIndex} index
   * @description prepare everything for the next slide animation and then run animation
   */
  private performFadeAction(newSlideIndex: number) {
    const oldSlideIndex = this.slideIndex;
    this.slideIndex = newSlideIndex % this.slides.length;
    if (this.slideIndex < 0) {
      this.slideIndex = this.slideIndex + this.slides.length;
    }

    // always pre-load this slide plus next slide.
    this.loadSlide(this.slideIndex);
    this.loadSlide(this.slideIndex + 1);

    this.resetAllSlides();

    if (oldSlideIndex < this.slideIndex) {
      this.slides[oldSlideIndex] = { ...this.slides[oldSlideIndex], action: 'fadeOut', rightSide: true };
      this.slides[this.slideIndex] = { ...this.slides[this.slideIndex], action: 'fadeIn', selected: true };
    } else {
      this.slides[oldSlideIndex] = { ...this.slides[oldSlideIndex], action: 'fadeOut', leftSide: true };
      this.slides[this.slideIndex] = { ...this.slides[this.slideIndex], action: 'fadeIn', selected: true };
    }

    this._cdRef.detectChanges();
  }

  /**
   * @param {number} index
   * @description set the index to the desired index - 1 and simulate a right slide
   */
  getSlideStyle(index: number) {
    const slide = this.slides[index];

    if (slide && slide.loaded) {
      return {
        "background-image": 'url(' + slide.image.url + ')',
        "background-size": slide.image.backgroundSize || this.backgroundSize,
        "background-position": slide.image.backgroundPosition || this.backgroundPosition,
        "background-repeat": slide.image.backgroundRepeat || this.backgroundRepeat
      };
    }
    else {
      // doesn't compile correctly if returning an empty object, sooooo.....
      return {
        "background-image": undefined,
        "background-size": undefined,
        "background-position": undefined,
        "background-repeat": undefined
      };
    }
  }

  exitFullScreen(e: Event) {
    e.preventDefault();
    this.fullscreen = false;
    this.onFullscreenExit.emit(true);
  }

  /**
   * @param {number} indexDirection
   * @param {boolean} isSwipe
   * @description Set the new slide index, then make the transition happen.
   */
  private slide(indexDirection: number, isSwipe?: boolean): void {
    this.performSlideAction(this.slideIndex + indexDirection);

    if (isSwipe === true) {
      indexDirection > 0 ? this.onSwipeRight.emit(this.slideIndex) : this.onSwipeLeft.emit(this.slideIndex);
    }
    else {
      indexDirection > 0 ? this.onSlideRight.emit(this.slideIndex) : this.onSlideLeft.emit(this.slideIndex);
    }
  }

  /**
   * @param {number} indexDirection
   * @description Set the new slide index, then make the fade-transition happen.
   */
  private fade(indexDirection: number): void {
    this.performFadeAction(this.slideIndex + indexDirection);
    indexDirection > 0 ? this.onSlideRight.emit(this.slideIndex) : this.onSlideLeft.emit(this.slideIndex);
  }

  /**
   * @description Check to make sure slide images have been set or haven't changed
   */
  private setSlides(): void {
    if (this.imageUrls) {
      if (this.checkCache() || this._initial === true) {
        this._initial = false;
        this._urlCache = Array.from(this.imageUrls);
        this.slides = [];

        if (this.lazyLoad === true) {
          this.buildLazyLoadSlideArray();
        }
        else {
          this.buildSlideArray();
        }
        this._cdRef.detectChanges();
      }
    }
  }

  /**
   * @description create the slides without background urls, which will be added in
   *              for the "lazy load," then load only the first slide
   */
  private buildLazyLoadSlideArray(): void {
    for (let image of this.imageUrls) {
      this.slides.push({
        image: (typeof image === 'string' ? { url: null } : { url: null, href: image.href || '' }),
        action: '',
        leftSide: false,
        rightSide: false,
        selected: false,
        loaded: false
      });
    }
    if (this.slideIndex === -1) {
      this.slideIndex = 0;
    }
    this.slides[this.slideIndex].selected = true;
    this.loadSlide(0);
    this.loadSlide(1);
    this.onIndexChanged.emit(this.slideIndex);
  }

  /**
   * @description create the slides with background urls all at once
   */
  private buildSlideArray(): void {
    for (let image of this.imageUrls) {
      this.slides.push({
        image: (typeof image === 'string' ? { url: image } : image),
        action: '',
        leftSide: false,
        rightSide: false,
        selected: false,
        loaded: true
      });
    }
    if (this.slideIndex === -1) {
      this.slideIndex = 0;
    }
    this.slides[this.slideIndex].selected = true;
    this.onIndexChanged.emit(this.slideIndex);
  }

  private loadSlide(index: number) {
    if (index < this.slides.length && !this.slides[index].loaded) {
      new Promise((resolve) => {
        const tmpImage = this.imageUrls[index];
        let loadImage = new Image();
        loadImage.addEventListener('load', () => {
          this.slides[index].image = (typeof tmpImage === 'string' ? { url: tmpImage } : tmpImage);
          this.slides[index].loaded = true;
          this._cdRef.detectChanges();
          this.onImageLazyLoad.emit(this.slides[index]);
          resolve();
        });
        loadImage.src = (typeof tmpImage === 'string' ? tmpImage : tmpImage.url);
      });
    }
  }

  /**
   * @param {boolean} stopAutoPlay
   * @description Start or stop autoPlay, don't do it at all server side
   */
  private handleAutoPlay(stopAutoPlay?: boolean): void {
    if (isPlatformServer(this.platform_id)) {
      return;
    }

    if (stopAutoPlay === true || this.autoPlay === false) {
      if (this._autoplayIntervalId) {
        this._ngZone.runOutsideAngular(() => clearInterval(this._autoplayIntervalId));
        this._autoplayIntervalId = null;
      }
      this.autoPlay = false;
    }
    else if (!this._autoplayIntervalId) {
      this._ngZone.runOutsideAngular(() => {
        this._autoplayIntervalId = setInterval(() => {
          if (!this.autoPlayWaitForLazyLoad || (this.autoPlayWaitForLazyLoad && this.slides[this.slideIndex] && this.slides[this.slideIndex].loaded)) {
            this._ngZone.run(() => this.autoPlayTransition == 'fade' ? this.fade(1) : this.slide(1));
          }
        }, this.autoPlayInterval);
      });
    }
  }

  /**
   * @description Keep the styles up to date with the input
   */
  private setStyles(): void {
    if (this.fullscreen) {
      this._renderer.setStyle(this.container.nativeElement, 'height', '100%');
      // Would be nice to make it configurable
      this._renderer.setStyle(this.container.nativeElement, 'background-color', 'white');
    }
    else {
      // Would be nice to make it configurable
      this._renderer.removeStyle(this.container.nativeElement, 'background-color');
      if (this.height) {
        this._renderer.setStyle(this.container.nativeElement, 'height', this.height);
      }

      if (this.minHeight) {
        this._renderer.setStyle(this.container.nativeElement, 'min-height', this.minHeight);
      }
    }
    if (this.arrowSize) {
      this._renderer.setStyle(this.prevArrow.nativeElement, 'height', this.arrowSize);
      this._renderer.setStyle(this.prevArrow.nativeElement, 'width', this.arrowSize);
      this._renderer.setStyle(this.nextArrow.nativeElement, 'height', this.arrowSize);
      this._renderer.setStyle(this.nextArrow.nativeElement, 'width', this.arrowSize);
    }
  }

  /**
   * @description compare image array to the cache, returns false if no changes
   */
  private checkCache(): boolean {
    return !(this._urlCache.length === this.imageUrls.length && this._urlCache.every((cacheElement, i) => cacheElement === this.imageUrls[i]));
  }

  /**
   * @param {number} index
   * @param {ISlide} slide
   * @returns {any}
   * @description a trackBy function for the ngFor loops
   */
  trackByFn(index: number, slide: ISlide): any {
    return slide.image;
  }

  /**
   * @description don't let click events fire, handle in pointer service instead
   */
  handleClick(event) {
    event.preventDefault();
  }
}
