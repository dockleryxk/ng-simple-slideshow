import {
  Component, ElementRef, EventEmitter, Inject, Input, Output, PLATFORM_ID, Renderer2,
  ViewChild,
  DoCheck
} from '@angular/core';
import { SwipeService } from './swipe.service';
import { isNullOrUndefined, isUndefined } from 'util';
import { isPlatformServer, DOCUMENT } from '@angular/common';
import { ISlide } from './ISlide';
import { IImage } from './IImage';
import { DomSanitizer, TransferState, makeStateKey } from '@angular/platform-browser';

const FIRST_SLIDE_KEY = makeStateKey<any>('firstSlide');

@Component({
  selector: 'slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements DoCheck {
  public slideIndex: number = 0;
  public slides: ISlide[] = [];
  private urlCache: (string | IImage)[];
  private autoplayIntervalId: any;
  private initial: boolean = true;
  private isHidden = false;

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
  @Input() debug: boolean = false;
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

  @Output('onSlideLeft') public onSlideLeft = new EventEmitter<number>();
  @Output('onSlideRight') public onSlideRight = new EventEmitter<number>();
  @Output('onSwipeLeft') public onSwipeLeft = new EventEmitter<number>();
  @Output('onSwipeRight') public onSwipeRight = new EventEmitter<number>();

  @ViewChild('container') container: ElementRef;
  @ViewChild('prevArrow') prevArrow: ElementRef;
  @ViewChild('nextArrow') nextArrow: ElementRef;

  constructor(
    private swipeService: SwipeService,
    private renderer: Renderer2,
    private transferState: TransferState,
    public sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platform_id: any,
    @Inject(DOCUMENT) private document: any
  ) { }

  ngDoCheck() {
    if (this.debug === true) console.log(`ngOnChanges()`);
    // if this is the first being called, create a copy of the input
    if (!isNullOrUndefined(this.imageUrls) && this.imageUrls.length > 0) {
      if (this.initial === true) this.urlCache = Array.from(this.imageUrls);
      if (this.isHidden === true) {
        this.renderer.removeStyle(this.container.nativeElement, 'display');
        this.isHidden = false;
      }
      this.setSlides();
    }
    else if (this.hideOnNoSlides === true) {
      this.renderer.setStyle(this.container.nativeElement, 'display', 'none');
      this.isHidden = true;
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
    if (this.debug === true) console.log(`onSlide(${ indexDirection }, ${ isSwipe })`);
    this.handleAutoPlay(this.stopAutoPlayOnSlide);
    this.slide(indexDirection, isSwipe);
  }

  /**
   * @param {TouchEvent} e
   * @param {string} when
   * @description Use the swipe service to detect swipe events from phone and tablets
   */
  onSwipe(e: TouchEvent, when: string): void {
    if (this.disableSwiping === true) return;
    const indexDirection = this.swipeService.swipe(e, when, this.debug === true);
    // handle a failed swipe
    if (indexDirection === 0) return;
    else this.onSlide(indexDirection, true);
  }

  /**
   * @param {MouseEvent} e
   * @description Redirect to current slide "href" if defined
   */
  onClick(e: MouseEvent): void {
    e.preventDefault();
    const currentSlide = this.slides.length > 0 && this.slides[this.slideIndex];
    if (currentSlide && !isNullOrUndefined(currentSlide.image.clickAction)) {
      currentSlide.image.clickAction();
    }
    else if (currentSlide && !isNullOrUndefined(currentSlide.image.href)) {
      this.document.location.href = currentSlide.image.href;
    }
  }

  /**
   * @param {number} index
   * @description set the index to the desired index - 1 and simulate a right slide
   */
  goToSlide(index: number) {
    if (this.debug === true) console.log(`goToSlide(${ index })`);
    const beforeClickIndex = this.slideIndex;
    this.slideIndex = index - 1;
    this.setSlideIndex(1);
    if (!this.slides[this.slideIndex].loaded) this.loadRemainingSlides();
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
    if (this.debug === true) console.log(`getSlideStyle(${ index })`);
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

  /**
   * @param {number} indexDirection
   * @param {boolean} isSwipe
   * @description Set the new slide index, then make the transition happen.
   */
  private slide(indexDirection: number, isSwipe?: boolean): void {
    if (this.debug === true) console.log(`slide(${ indexDirection }, ${ isSwipe })`);
    const oldIndex = this.slideIndex;
    this.setSlideIndex(indexDirection);
    if (!this.slides[this.slideIndex].loaded) this.loadRemainingSlides();
    if (indexDirection === 1) this.slideRight(oldIndex, isSwipe);
    else this.slideLeft(oldIndex, isSwipe);
    this.slides[oldIndex].selected = false;
    this.slides[this.slideIndex].selected = true;
  }

  /**
   * @param {number} indexDirection
   * @description This is just treating the url array like a circular list.
   */
  private setSlideIndex(indexDirection: number): void {
    if (this.debug === true) console.log(`setSlideIndex(${ this.slideIndex })`);
    this.slideIndex += indexDirection;
    if (this.slideIndex < 0) this.slideIndex = this.slides.length - 1;
    if (this.slideIndex >= this.slides.length) this.slideIndex = 0;
  }

  /**
   * @param {number} oldIndex
   * @param {boolean} isSwipe
   * @description This function handles the variables to move the CSS classes around accordingly.
   *              In order to correctly handle animations, the new slide as well as the slides to
   *              the left and right are assigned classes.
   */
  private slideLeft(oldIndex: number, isSwipe?: boolean): void {
    if (this.debug === true) console.log(`slideLeft(${ oldIndex }, ${ isSwipe })`);
    if (isSwipe === true) this.onSwipeLeft.emit(this.slideIndex);
    else this.onSlideLeft.emit(this.slideIndex);
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
    if (this.debug === true) console.log(`slideRight(${ oldIndex }, ${ isSwipe })`);
    if (isSwipe === true) this.onSwipeRight.emit(this.slideIndex);
    else this.onSlideRight.emit(this.slideIndex);
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
    if (!isNullOrUndefined(this.imageUrls)) {
      if (this.debug === true) console.log(`setSlides()`);
      if (this.checkCache() || this.initial === true) {
        if (this.debug === true) {
          console.log(`this.checkCache() || this.initial === true`);
          console.log(`this.initial: ${ this.initial }`);
          console.log(`this.urlCache: ${ this.urlCache }`);
          console.log(`this.imageUrls: ${ this.imageUrls }`);
        }
        this.initial = false;
        this.urlCache = Array.from(this.imageUrls);
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
    if (this.debug === true) console.log(`buildLazyLoadSlideArray()`);
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
    this.slides[this.slideIndex].selected = true;
    this.loadFirstSlide();
  }

  /**
   * @description create the slides with background urls all at once
   */
  private buildSlideArray(): void {
    if (this.debug === true) console.log(`buildSlideArray()`);
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
    this.slides[this.slideIndex].selected = true;
  }

  /**
   * @description load the first slide image if lazy loading
   *              this takes server side and browser side into account
   */
  private loadFirstSlide(): void {
    if (this.debug === true) console.log(`loadFirstSlide()`);
    const tmpIndex = this.slideIndex;
    const tmpImage = this.imageUrls[tmpIndex];

    // if server side, we don't need to worry about the rest of the slides
    if (isPlatformServer(this.platform_id)) {
      this.slides[tmpIndex].image = (typeof tmpImage === 'string' ? { url: tmpImage } : tmpImage);
      this.slides[tmpIndex].loaded = true;
      this.transferState.set(FIRST_SLIDE_KEY, this.slides[tmpIndex]);
    }
    else {
      const firstSlideFromTransferState = this.transferState.get(FIRST_SLIDE_KEY, null as any);
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
        this.transferState.remove(FIRST_SLIDE_KEY);
      }
    }
  }

  /**
   * @description if lazy loading in browser, start loading remaining slides
   * @todo: figure out how to not show the spinner if images are loading fast enough
   */
  private loadRemainingSlides(): void {
    if (this.debug === true) console.log(`loadRemainingSlides()`);
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
    if (isPlatformServer(this.platform_id)) return;
    if (stopAutoPlay === true || this.autoPlay === false) {
      if (this.debug === true) console.log(`stop autoPlay`);
      if (!isNullOrUndefined(this.autoplayIntervalId)) clearInterval(this.autoplayIntervalId);
    }
    else if (isNullOrUndefined(this.autoplayIntervalId)) {
      if (this.debug === true) console.log(`start autoPlay`);
      this.autoplayIntervalId = setInterval(() => {
        if (this.debug === true) console.log(`autoPlay slide event`);
        if (!this.autoPlayWaitForLazyLoad || (this.autoPlayWaitForLazyLoad && this.slides[this.slideIndex].loaded)) this.slide(1);
      }, this.autoPlayInterval);
    }
  }

  /**
   * @description Keep the styles up to date with the input
   */
  private setStyles(): void {
    if (this.debug === true) console.log(`setStyles()`);
    if (!isNullOrUndefined(this.height)) this.renderer.setStyle(this.container.nativeElement, 'height', this.height);
    if (!isNullOrUndefined(this.minHeight)) this.renderer.setStyle(this.container.nativeElement, 'min-height', this.minHeight);
    if (!isNullOrUndefined(this.arrowSize)) {
      this.renderer.setStyle(this.prevArrow.nativeElement, 'height', this.arrowSize);
      this.renderer.setStyle(this.prevArrow.nativeElement, 'width', this.arrowSize);
      this.renderer.setStyle(this.nextArrow.nativeElement, 'height', this.arrowSize);
      this.renderer.setStyle(this.nextArrow.nativeElement, 'width', this.arrowSize);
    }
  }

  /**
   * @description compare image array to the cache, returns false if no changes
   */
  private checkCache(): boolean {
    if (this.debug === true) console.log(`checkCache()`);
    return !(this.urlCache.length === this.imageUrls.length && this.urlCache.every((cacheElement, i) => cacheElement === this.imageUrls[i]));
  }

  /**
   * @param {number} i
   * @returns {number}
   * @description get the index for the slide to the left of the new slide
   */
  private getLeftSideIndex(i?: number): number {
    if (isUndefined(i)) i = this.slideIndex;
    if (--i < 0) i = this.slides.length - 1;
    return i;
  }

  /**
   * @param {number} i
   * @returns {number}
   * @description get the index for the slide to the right of the new slide
   */
  private getRightSideIndex(i?: number): number {
    if (isUndefined(i)) i = this.slideIndex;
    if (++i >= this.slides.length) i = 0;
    return i;
  }
}
