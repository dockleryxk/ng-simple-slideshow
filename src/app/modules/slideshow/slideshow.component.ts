import { Component, ElementRef, EventEmitter, Inject, Input, Output, PLATFORM_ID, Renderer2, ViewChild, DoCheck, NgZone, OnInit } from '@angular/core';
import { SwipeService } from './swipe.service';
import { isPlatformServer, DOCUMENT } from '@angular/common';
import { ISlide } from './ISlide';
import { IImage } from './IImage';
import { DomSanitizer, TransferState, makeStateKey, SafeStyle } from '@angular/platform-browser';

const FIRST_SLIDE_KEY = makeStateKey<any>('firstSlide');

@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit, DoCheck {
  slideIndex: number = -1;
  slides: ISlide[] = [];
  private _urlCache: (string | IImage)[];
  private _autoplayIntervalId: any;
  private _initial: boolean = true;
  private _isHidden: boolean = false;

  @Input() imageUrls: (string | IImage)[] = [];
  @Input() height: string = '100%';
  @Input() minHeight: string;
  @Input() arrowSize: string;
  @Input() showArrows: boolean = true;
  @Input() disableSwiping: boolean = false;
  @Input() autoPlay: boolean = false;
  @Input() autoPlayInterval: number = 3333;
  @Input() stopAutoPlayOnSlide: boolean = true;
  @Input() autoPlayWaitForLazyLoad: boolean = false;
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

  @Output() onSlideLeft = new EventEmitter<number>();
  @Output() onSlideRight = new EventEmitter<number>();
  @Output() onSwipeLeft = new EventEmitter<number>();
  @Output() onSwipeRight = new EventEmitter<number>();
  @Output() onFullscreenExit = new EventEmitter<boolean>();
  @Output() onIndexChanged = new EventEmitter<number>();

  @ViewChild('container') container: ElementRef;
  @ViewChild('prevArrow') prevArrow: ElementRef;
  @ViewChild('nextArrow') nextArrow: ElementRef;

  get safeStyleDotColor(): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`--dot-color: ${ this.dotColor }`);
  }

  constructor(
    private _swipeService: SwipeService,
    private _renderer: Renderer2,
    private _transferState: TransferState,
    private _ngZone: NgZone,
    public sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platform_id: any,
    @Inject(DOCUMENT) private document: any
  ) { }

  ngOnInit() {
    if (this.debug !== undefined) {
      console.warn('[Deprecation Warning]: The debug input will be removed from ng-simple-slideshow in 1.3.0');
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
   * @param {TouchEvent} e
   * @param {string} when
   * @description Use the swipe service to detect swipe events from phone and tablets
   */
  onSwipe(e: TouchEvent, when: string): void {
    if (this.disableSwiping === true) {
      return;
    }

    const indexDirection = this._swipeService.swipe(e, when);
    // handle a failed swipe
    if (indexDirection === 0) {
      return;
    }
    else {
      this.onSlide(indexDirection, true);
    }
  }

  /**
   * @param {MouseEvent} e
   * @description Redirect to current slide "href" if defined
   */
  onClick(e: MouseEvent): void {
    e.preventDefault();
    const currentSlide = this.slides.length > 0 && this.slides[this.slideIndex];

    if (currentSlide && currentSlide.image.clickAction) {
      currentSlide.image.clickAction();
    }
    else if (currentSlide && currentSlide.image.href) {
      this.document.location.href = currentSlide.image.href;
    }
  }

  /**
   * @param {number} index
   * @description set the index to the desired index - 1 and simulate a right slide
   */
  goToSlide(index: number) {
    const beforeClickIndex = this.slideIndex;
    this.slideIndex = index - 1;
    this.setSlideIndex(1);

    if (!this.slides[this.slideIndex].loaded) {
      this.loadRemainingSlides();
    }

    this.handleAutoPlay(this.stopAutoPlayOnSlide);
    this.slideRight(beforeClickIndex);
    this.slides[beforeClickIndex].selected = false;
    this.slides[this.slideIndex].selected = true;
  }

  /**
   * @param {number} index
   * @description set the index to the desired index - 1 and simulate a right slide
   */
  getSlideStyle(index: number) {
    const slide = this.slides[index];

    if (slide.loaded) {
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
    const oldIndex = this.slideIndex;

    this.setSlideIndex(indexDirection);

    if (!this.slides[this.slideIndex].loaded) {
      this.loadRemainingSlides();
    }

    if (indexDirection === 1) {
      this.slideRight(oldIndex, isSwipe);
    }
    else {
      this.slideLeft(oldIndex, isSwipe);
    }

    this.slides[oldIndex].selected = false;
    this.slides[this.slideIndex].selected = true;
  }

  /**
   * @param {number} indexDirection
   * @description This is just treating the url array like a circular list.
   */
  private setSlideIndex(indexDirection: number): void {
    this.slideIndex += indexDirection;

    if (this.slideIndex < 0) {
      this.slideIndex = this.slides.length - 1;
    }

    if (this.slideIndex >= this.slides.length) {
      this.slideIndex = 0;
    }
    this.onIndexChanged.emit(this.slideIndex);
  }

  /**
   * @param {number} oldIndex
   * @param {boolean} isSwipe
   * @description This function handles the variables to move the CSS classes around accordingly.
   *              In order to correctly handle animations, the new slide as well as the slides to
   *              the left and right are assigned classes.
   */
  private slideLeft(oldIndex: number, isSwipe?: boolean): void {
    if (isSwipe === true) {
      this.onSwipeLeft.emit(this.slideIndex);
    }
    else {
      this.onSlideLeft.emit(this.slideIndex);
    }

    this.slides[this.getLeftSideIndex(oldIndex)].leftSide = false;
    this.slides[oldIndex].leftSide = true;
    this.slides[oldIndex].action = 'slideOutLeft';
    this.slides[this.slideIndex].rightSide = false;
    this.slides[this.getRightSideIndex()].rightSide = true;
    this.slides[this.slideIndex].action = 'slideInRight';
  }

  /**
   * @param {number} oldIndex
   * @param {boolean} isSwipe
   * @description This function handles the variables to move the CSS classes around accordingly.
   *              In order to correctly handle animations, the new slide as well as the slides to
   *              the left and right are assigned classes.
   */
  private slideRight(oldIndex: number, isSwipe?: boolean): void {
    if (isSwipe === true) {
      this.onSwipeRight.emit(this.slideIndex);
    }
    else {
      this.onSlideRight.emit(this.slideIndex);
    }

    this.slides[this.getRightSideIndex(oldIndex)].rightSide = false;
    this.slides[oldIndex].rightSide = true;
    this.slides[oldIndex].action = 'slideOutRight';
    this.slides[this.slideIndex].leftSide = false;
    this.slides[this.getLeftSideIndex()].leftSide = true;
    this.slides[this.slideIndex].action = 'slideInLeft';
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
    
    this.slideIndex = 0;
    this.slides[this.slideIndex].selected = true;
    this.loadFirstSlide();
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
    this.slideIndex = 0;
    this.slides[this.slideIndex].selected = true;
    this.onIndexChanged.emit(this.slideIndex);
  }

  /**
   * @description load the first slide image if lazy loading
   *              this takes server side and browser side into account
   */
  private loadFirstSlide(): void {
    const tmpIndex = this.slideIndex;
    const tmpImage = this.imageUrls[tmpIndex];

    // if server side, we don't need to worry about the rest of the slides
    if (isPlatformServer(this.platform_id)) {
      this.slides[tmpIndex].image = (typeof tmpImage === 'string' ? { url: tmpImage } : tmpImage);
      this.slides[tmpIndex].loaded = true;
      this._transferState.set(FIRST_SLIDE_KEY, this.slides[tmpIndex]);
    }
    else {
      const firstSlideFromTransferState = this._transferState.get(FIRST_SLIDE_KEY, null as any);
      // if the first slide didn't finish loading on the server side, we need to load it
      if (firstSlideFromTransferState === null) {
        let loadImage = new Image();
        loadImage.src = (typeof tmpImage === 'string' ? tmpImage : tmpImage.url);
        loadImage.addEventListener('load', () => {
          this.slides[tmpIndex].image = (typeof tmpImage === 'string' ? { url: tmpImage } : tmpImage);
          this.slides[tmpIndex].loaded = true;
        });
      }
      else {
        this.slides[tmpIndex] = firstSlideFromTransferState;
        this._transferState.remove(FIRST_SLIDE_KEY);
      }
    }
  }

  /**
   * @description if lazy loading in browser, start loading remaining slides
   * @todo: figure out how to not show the spinner if images are loading fast enough
   */
  private loadRemainingSlides(): void {
    for (let i = 0; i < this.slides.length; i++) {
      if (!this.slides[i].loaded) {
        new Promise((resolve) => {
          const tmpImage = this.imageUrls[i];
          let loadImage = new Image();
          loadImage.addEventListener('load', () => {
            this.slides[i].image = (typeof tmpImage === 'string' ? { url: tmpImage } : tmpImage);
            this.slides[i].loaded = true;
            resolve();
          });
          loadImage.src = (typeof tmpImage === 'string' ? tmpImage : tmpImage.url);
        });
      }
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
    }
    else if (!this._autoplayIntervalId) {
      this._ngZone.runOutsideAngular(() => {
        this._autoplayIntervalId = setInterval(() => {
          if (!this.autoPlayWaitForLazyLoad || (this.autoPlayWaitForLazyLoad && this.slides[this.slideIndex].loaded)) {
            this._ngZone.run(() => this.slide(1));
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
    } else {
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
   * @param {number} i
   * @returns {number}
   * @description get the index for the slide to the left of the new slide
   */
  private getLeftSideIndex(i?: number): number {
    if (i === undefined) {
      i = this.slideIndex;
    }

    if (--i < 0) {
      i = this.slides.length - 1;
    }

    return i;
  }

  /**
   * @param {number} i
   * @returns {number}
   * @description get the index for the slide to the right of the new slide
   */
  private getRightSideIndex(i?: number): number {
    if (i === undefined) {
      i = this.slideIndex;
    }

    if (++i >= this.slides.length) {
      i = 0;
    }

    return i;
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
}
