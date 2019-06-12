import { Injectable, ElementRef, EventEmitter, Renderer2, Inject, PLATFORM_ID, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

class State {
  // a tag width
  aw: number = 0;
  // a tag height
  ah: number = 0;
  // actual image width
  w: number = 0;
  // actual image height
  h: number = 0;
  // aspect ratio of image
  get ar(): number {
    return this.w / this.h;
  }
  // diagonal of image
  get diag(): number {
    return Math.sqrt((this.w * this.w) + (this.h * this.h));
  }
  // is state populated and valid
  get valid(): boolean {
    return this.w > 0 && this.h > 0 && this.aw > 0 && this.ah > 0;
  }
  // is image actual size bounded by width against the a tag view port, horizontal clip in case of cover
  get widthBound(): boolean {
    return this.ar > (this.aw / this.ah);
  }
}

@Injectable()
export class PointerService {
  // private _renderer: Renderer2;

  //options
  private _disableSwiping = false;
  private _enableZoom = false;
  private _enablePan = false;

  // adapted from https://github.com/mdn/dom-examples/blob/master/pointerevents/Pinch_zoom_gestures.html
  private _startEVCache: PointerEvent = null;
  private _evCache: Array<PointerEvent> = new Array();
  private _previousDiagonal: number = -1;
  private _originalState: State = new State();
  private _slideEvent: EventEmitter<number> = new EventEmitter<number>(true);
  // custom click event is a workaround for the fact that click+move will fire a click event after move
  private _clickEvent: EventEmitter<void> = new EventEmitter<void>(true);

  private pointerUp = (event: PointerEvent) => {
    this._pointerUp(event);
  }

  private pointerDown = (event: PointerEvent) => {
    this._pointerDown(event);
  }

  private pointerMove = (event: PointerEvent) => {
    this._pointerMove(event);
  }

  public set disableSwiping(state: boolean) {
    this._disableSwiping = state;
  }

  public set enableZoom(state: boolean) {
    this._enableZoom = state;
  }

  public set enablePan(state: boolean) {
    this._enablePan = state;
  }

  bind(el: ElementRef) {
    if (isPlatformBrowser(this.platform_id)) {
      el.nativeElement.addEventListener('pointerdown', this.pointerDown);
      el.nativeElement.addEventListener('pointerup', this.pointerUp);
      el.nativeElement.addEventListener('pointercancel', this.pointerUp);
      el.nativeElement.addEventListener('pointerout', this.pointerUp);
      el.nativeElement.addEventListener('pointerleave', this.pointerUp);
      el.nativeElement.addEventListener('pointermove', this.pointerMove);
    }
  }

  unbind(el: ElementRef) {
    if (isPlatformBrowser(this.platform_id)) {
      el.nativeElement.removeEventListener('pointerdown', this.pointerDown);
      el.nativeElement.removeEventListener('pointerup', this.pointerUp);
      el.nativeElement.removeEventListener('pointercancel', this.pointerUp);
      el.nativeElement.removeEventListener('pointerout', this.pointerUp);
      el.nativeElement.removeEventListener('pointerleave', this.pointerUp);
      el.nativeElement.removeEventListener('pointermove', this.pointerMove);
    }
  }

  public get slideEvent(): EventEmitter<Number> {
    return this._slideEvent;
  }

  public get clickEvent(): EventEmitter<void> {
    return this._clickEvent;
  }

  constructor(
    // rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platform_id: any
  ) {
    // this._renderer = rendererFactory.createRenderer(null, null);
  }

  private _pointerDown(e: PointerEvent) {
    this._evCache.push(e);
    if (this._evCache.length === 1) {
      this._startEVCache = e;
      if (this._enablePan || this._enableZoom) {
        // Cache the image sizes and container sizes
        this._loadOriginalState(e);
        // Convert backgroundSize to pixels
        this._convertBGSizeToPixels(e);
        // Convert backgroundPosition to pixels
        this._convertBGPosToPixels(e);
      }
    }
  }

  // Saving original state, calculation is done only once during during 1st pointerdown
  private _loadOriginalState(e: PointerEvent): void {
    if (!this._originalState.valid && e.target && (e.target as any).style && (e.target as any).style.backgroundImage) {
      const imgUrlArr = (e.target as any).style.backgroundImage.match(/^url\(["']?(.+?)["']?\)$/);
      const img = new Image();
      img.src = imgUrlArr[1];
      this._originalState.aw = (e.target as any).offsetWidth;
      this._originalState.ah = (e.target as any).offsetHeight;
      this._originalState.w = img.width;
      this._originalState.h = img.height;
    }
  }

  // Convert BG size literals and percentage to pixels in x axis and preserve image aspect ratio
  private _convertBGSizeToPixels(e: PointerEvent): void {
    const imgElement = (e.target as any);
    let bgSize = imgElement.style.backgroundSize;
    if (bgSize.indexOf(' ') > -1) {
      // backgroundSize pattern "auto 100px" or "100px auto" or "100px 200px"
      const sizeTuple = bgSize.split(' ');
      bgSize = this._originalState.widthBound ? sizeTuple[0] : sizeTuple[1];
    }
    if (bgSize === 'cover') {
      bgSize = this._originalState.widthBound ? this._originalState.ah * this._originalState.ar : this._originalState.aw;
    }
    else if (bgSize.indexOf('px') > -1) {
      bgSize = bgSize.substring(0, bgSize.length - 2);
    }
    else if (bgSize.indexOf('%') > -1) { // Untested
      const bgSizePercentage = Number(bgSize.substring(0, bgSize.length - 1)) / 100;
      bgSize = this._originalState.widthBound ? this._originalState.aw * bgSizePercentage : this._originalState.ah * bgSizePercentage * this._originalState.ar;
    }
    else if (bgSize === 'auto') {
      bgSize = this._originalState.w;
    }
    else if (bgSize === 'contain') {
      bgSize = this._originalState.widthBound ? this._originalState.aw : this._originalState.ah * this._originalState.ar;
    }
    else {
      // backgroundSize pattern "could not identify" // will be treated as contain
      bgSize = this._originalState.widthBound ? this._originalState.aw : this._originalState.ah * this._originalState.ar;
    }
    imgElement.style.backgroundSize = bgSize + 'px auto';
  }

  // Convert BG position literals and percentage to pixels
  private _convertBGPosToPixels(e: PointerEvent): void {
    if (this._originalState.valid) {
      const imgElement = (e.target as any);
      const bgSize = this._currentBGSize(e);
      let bgPosX = imgElement.style.backgroundPositionX;
      if (bgPosX.indexOf('px') === -1) {
        bgPosX = this._convertLiteralPosToPercentage(bgPosX);
        if (bgPosX.indexOf('%') > -1) {
          let bgPosXPercentage = Number(bgPosX.substring(0, bgPosX.length - 1)) / 100;
          bgPosX = bgPosXPercentage * (this._originalState.aw - bgSize);
        }
        imgElement.style.backgroundPositionX = bgPosX + 'px';
      }
      let bgPosY = imgElement.style.backgroundPositionY;
      if (bgPosY.indexOf('px') === -1) {
        bgPosY = this._convertLiteralPosToPercentage(bgPosY);
        if (bgPosY.indexOf('%') > -1) {
          let bgPosYPercentage = Number(bgPosY.substring(0, bgPosY.length - 1)) / 100;
          bgPosY = bgPosYPercentage * (this._originalState.ah - (bgSize / this._originalState.ar));
        }
        imgElement.style.backgroundPositionY = bgPosY + 'px';
      }
    }
  }

  private _pointerUp(e: PointerEvent) {
    // Remove this event from the target's cache
    for (let i = 0; i < this._evCache.length; i++) {
      if (this._evCache[i].pointerId === e.pointerId) {
        this._evCache.splice(i, 1);
        break;
      }
    }
    // Purge diagonal if 2 pointers are not present
    if (this._evCache.length !== 2) {
      this._previousDiagonal = -1;
    }
    // Purge start event and original state if no pointers are present
    if (this._evCache.length === 0 && this._startEVCache !== null) {
      this._checkClickOrSwipe(e);
      this._startEVCache = null;
      this._originalState = new State();
    }
  }

  /**
   * 0th Check
   * target is a slide
   *
   * 1st Check for click
   * or x movement is less than 15 px and y movement is less than 15 px
   *
   * 2nd if not click, check for swipe
   * duration < 1000 ms
   * and x movement is >= 30 px
   * and y movement is <= 100 px
   */
  private _checkClickOrSwipe(e: PointerEvent): void {
    if (!this._targetIsASlide(e)) {
      return;
    }
    const duration = e.timeStamp - this._startEVCache.timeStamp;
    const dirX = e.pageX - this._startEVCache.pageX;
    const dirY = e.pageY - this._startEVCache.pageY;
    if (!this._enablePan // Skip click event when panning is enabled
      && Math.abs(dirX) < 15 // Very less x movement
      && Math.abs(dirY) < 15 // Very less y movement
    ) {
      // Click
      this._clickEvent.emit();
    }
    else if (duration < 1000 // Short enough
      && Math.abs(dirY) <= 100 // Horizontal enough
      && Math.abs(dirX) >= 30 // Long enough
      && !this._disableSwiping // swipe enabled
      && this._cannotPanMoreTest(e, dirX) // cannot pan in swipe direction
    ) {
      // swipe
      this._slideEvent.emit(dirX < 0 ? 1 : -1);
    }
  }

  // Deem the target is a slide if it contains the slides class
  private _targetIsASlide(e: PointerEvent): boolean {
    return (e.target as any).classList.contains('slides');
  }

  // Check if image can pan more in the swipe direction. Return false if it can.
  private _cannotPanMoreTest(e: PointerEvent, dirX: number): boolean {
    if (!this._enablePan) { // Pan not enabled
      return true;
    }
    const xPos = this._currentBGPosX(e);
    const bgSize = this._currentBGSize(e);
    if (dirX < 0 && bgSize > this._originalState.aw && Math.round(this._originalState.aw - bgSize - xPos) < 0) {
      // image can be panned to the right
      return false;
    }
    else if (dirX > 0 && bgSize > this._originalState.aw && xPos < 0) {
      // image can be panned to the left
      return false;
    }
    return true;
  }

  private _pointerMove(e: PointerEvent) {
    // Prevent defaulted to start drag event after mouse click, else cancel event gets fired
    e.preventDefault();

    // If one pointer is down, goto 1 point action
    if (this._evCache.length === 1 && this._enablePan) {
      this._1pointMoveAction(e);
    }
    // Find this event in the cache and update its record with this event
    for (let i = 0; i < this._evCache.length; i++) {
      if (e.pointerId === this._evCache[i].pointerId) {
        this._evCache[i] = e;
        break;
      }
    }
    // If two pointers are down, goto 2 point action
    if (this._evCache.length === 2 && this._enableZoom) {
      this._2pointMoveAction(e);
    }
  }

  private _1pointMoveAction(e: PointerEvent): void {
    if (this._evCache[0].pointerId === e.pointerId) {
      const dx = this._evCache[0].pageX - e.pageX;
      const dy = this._evCache[0].pageY - e.pageY;
      if (this._originalState.valid && (dx !== 0 || dy !== 0)) {
        this._transformBGPosition(e, dx, dy);
      }
    }
  }

  private _2pointMoveAction(e: PointerEvent): void {
    // check for pinch gestures
    // Calculate the distance between the two pointers
    const x = Math.abs(this._evCache[0].pageX - this._evCache[1].pageX);
    const y = Math.abs(this._evCache[0].pageY - this._evCache[1].pageY);
    let currentDiagonal = Math.sqrt((x * x) + (y * y));

    // Start 2 point action after previous diagonal and orginal state is valid
    if (this._previousDiagonal > 0 && this._originalState.valid) {
      const deltaX = currentDiagonal - this._previousDiagonal;
      this._transformBGSize(e, deltaX);
    }
    this._previousDiagonal = currentDiagonal;
  }

  // commented and not used, actual deltaX is too small for proper user experience
  // calculate movement in x axis after 2 point movement, assume isosceles right triangle
  // private _deltaX(prevDiag: number, currDiag: number): number {
  //   return (currDiag - prevDiag) / Math.sqrt(2);
  // }

  // Transform the image background position
  private _transformBGPosition(e: PointerEvent, dx: number, dy: number): void {
    const imgElement = (e.target as any);
    const previousPosX = this._currentBGPosX(e);
    const previousPosY = this._currentBGPosY(e);
    const newPosX = this._newBGPosXConstraint(previousPosX - dx, e);
    const newPosY = this._newBGPosYConstraint(previousPosY - dy, e);
    if (newPosX !== previousPosX || newPosY !== previousPosY) {
      this._setBGPos(imgElement, newPosX, newPosY);
    }
  }

  // Set new background position
  private _setBGPos(element: any, x: number, y: number): void {
    element.style.backgroundPositionX = x + 'px';
    element.style.backgroundPositionY = y + 'px';
  }

  // Check for current background position x
  private _currentBGPosX(e: PointerEvent): number {
    let bgPosX = (e.target as any).style.backgroundPositionX;
    if (bgPosX.indexOf('px') > -1) {
      bgPosX = bgPosX.substring(0, bgPosX.length - 2);
    }
    return Number(bgPosX);
  }

  // Check for current background position y
  private _currentBGPosY(e: PointerEvent): number {
    let bgPosY = (e.target as any).style.backgroundPositionY;
    if (bgPosY.indexOf('px') > -1) {
      bgPosY = bgPosY.substring(0, bgPosY.length - 2);
    }
    return Number(bgPosY);
  }

  private _convertLiteralPosToPercentage(literal: string): string {
    if (literal === 'center') {
      return '50%';
    }
    else if (literal === 'top' || literal === 'left') {
      return '0%';
    }
    else if (literal === 'bottom' || literal === 'right') {
      return '100%';
    }
  }

  // Transform the image background size by deltaX
  private _transformBGSize(e: PointerEvent, deltaX: number): void {
    const imgElement = (e.target as any);
    const currentSize = this._currentBGSize(e);
    const newSize = this._newBGSizeConstraint(currentSize + deltaX);
    if (newSize !== currentSize) {
      this._setBGSize(imgElement, newSize);
    }
  }

  private _setBGSize(element: any, size: number): void {
    element.style.backgroundSize = size + 'px auto';
    // stop all browser touch action after zooming slide
    element.style.touchAction = 'none';
  }

  // Check for current background size
  private _currentBGSize(e: PointerEvent): number {
    const bgSize = (e.target as any).style.backgroundSize;
    if (bgSize.indexOf(' ') > -1) {
      // backgroundSize pattern "auto 100px" or "100px auto" or "100px 200px"
      const sizeTuple = bgSize.split(' ');
      const size = this._originalState.widthBound ? sizeTuple[0].substring(0, sizeTuple[0].length - 2) : sizeTuple[1].substring(0, sizeTuple[1].length - 2);
      return Number(size);
    }
    else if (bgSize.indexOf('px') > -1) {
      // backgroundSize pattern "100px"
      const size = bgSize.substring(0, bgSize.length - 2);
      return Number(size);
    }
  }

  // If image size is below "contain", set to "contain"
  private _newBGSizeConstraint(newSize: number): number {
    if (this._originalState.widthBound) {
      return newSize < this._originalState.aw ? this._originalState.aw : newSize;
    } else {
      return newSize / this._originalState.ar < this._originalState.ah ? this._originalState.ah * this._originalState.ar : newSize;
    }
  }

  private _newBGPosXConstraint(newX: number, e: PointerEvent): number {
    const bgSize = this._currentBGSize(e);
    if (bgSize >= this._originalState.aw) {
      // when image width is greater than container width
      if (newX > 0) {
        return 0;
      }
      else if (newX < this._originalState.aw - bgSize) {
        return this._originalState.aw - bgSize;
      }
    }
    else {
      if (newX < 0) {
        return 0;
      }
      else if (newX > this._originalState.aw - bgSize) {
        return this._originalState.aw - bgSize;
      }
    }
    return newX;
  }

  private _newBGPosYConstraint(newY: number, e: PointerEvent): number {
    const bgSize = this._currentBGSize(e);
    if (bgSize / this._originalState.ar >= this._originalState.ah) {
      // when image height is greater than container height
      if (newY > 0) {
        return 0;
      }
      else if (newY < this._originalState.ah - (bgSize / this._originalState.ar)) {
        return this._originalState.ah - (bgSize / this._originalState.ar);
      }
    }
    else {
      if (newY < 0) {
        return 0;
      }
      else if (newY > this._originalState.ah - (bgSize / this._originalState.ar)) {
        return this._originalState.ah - (bgSize / this._originalState.ar);
      }
    }
    return newY;
  }
}
