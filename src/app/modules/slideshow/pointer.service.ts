import { Injectable, ElementRef } from '@angular/core';

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
  // is image actual size bounded by width against the a tag view port
  get widthBound(): boolean {
    return this.ar > (this.aw / this.ah);
  }
}

@Injectable()
export class PointerService {

  // adapted from https://github.com/mdn/dom-examples/blob/master/pointerevents/Pinch_zoom_gestures.html
  private _evCache: Array<PointerEvent> = new Array();
  private _previousDiagonal: number = -1;
  private _originalState: State = new State();

  private pointerUp = (event: PointerEvent) => {
    this._pointerUp(event);
  }

  private pointerDown = (event: PointerEvent) => {
    this._pointerDown(event);
  }

  private pointerMove = (event: PointerEvent) => {
    this._pointerMove(event);
  }

  bind(el: ElementRef) {
    el.nativeElement.addEventListener('pointerdown', this.pointerDown);
    el.nativeElement.addEventListener('pointerup', this.pointerUp);
    el.nativeElement.addEventListener('pointercancel', this.pointerUp);
    el.nativeElement.addEventListener('pointerout', this.pointerUp);
    el.nativeElement.addEventListener('pointerleave', this.pointerUp);
    el.nativeElement.addEventListener('pointermove', this.pointerMove);
  }

  unbind(el: ElementRef) {
    el.nativeElement.removeEventListener('pointerdown', this.pointerDown);
    el.nativeElement.removeEventListener('pointerup', this.pointerUp);
    el.nativeElement.removeEventListener('pointercancel', this.pointerUp);
    el.nativeElement.removeEventListener('pointerout', this.pointerUp);
    el.nativeElement.removeEventListener('pointerleave', this.pointerUp);
    el.nativeElement.removeEventListener('pointermove', this.pointerMove);
  }

  private _pointerDown(e: PointerEvent) {
    this._evCache.push(e);
  }

  private _pointerUp(e: PointerEvent) {
    // Remove this event from the target's cache
    for (let i = 0; i < this._evCache.length; i++) {
      if (this._evCache[i].pointerId === e.pointerId) {
        this._evCache.splice(i, 1);
        break;
      }
    }
    this._previousDiagonal = -1;
    this._originalState = new State();
  }

  private _pointerMove(e: PointerEvent) {
    // Find this event in the cache and update its record with this event
    for (let i = 0; i < this._evCache.length; i++) {
      if (e.pointerId === this._evCache[i].pointerId) {
        this._evCache[i] = e;
        break;
      }
    }
    // If two pointers are down, goto 2 point action
    if (this._evCache.length === 2) {
      this._2pointMoveAction(e);
    }
  }

  private _2pointMoveAction(e: PointerEvent): void {
    // check for pinch gestures
    // Calculate the distance between the two pointers
    const x = Math.abs(this._evCache[0].clientX - this._evCache[1].clientX);
    const y = Math.abs(this._evCache[0].clientY - this._evCache[1].clientY);
    let currentDiagonal = Math.sqrt((x * x) + (y * y));

    // Start 2 point action after previous diagonal and orginal state is valid
    if (this._previousDiagonal > 0 && this._loadOriginalState(e)) {
      const deltaX = currentDiagonal - this._previousDiagonal;
      this._transformImage(e, deltaX);
    }
    this._previousDiagonal = currentDiagonal;
  }

  // Saving original state, calculation is done only once during during one pinch cycle
  private _loadOriginalState(e: PointerEvent): boolean {
    if (!this._originalState.valid && e.target && (e.target as any).style && (e.target as any).style.backgroundImage) {
      const imgUrlArr = (e.target as any).style.backgroundImage.match(/^url\(["']?(.+?)["']?\)$/);
      const img = new Image;
      img.src = imgUrlArr[1];
      this._originalState.aw = (e.target as any).offsetWidth;
      this._originalState.ah = (e.target as any).offsetHeight;
      this._originalState.w = img.width;
      this._originalState.h = img.height;
    }
    return this._originalState.valid;
  }

  // commented and not used, actual deltaX is too small for proper user experience
  // calculate movement in x axis after 2 point movement, assume isosceles right triangle
  // private _deltaX(prevDiag: number, currDiag: number): number {
  //   return (currDiag - prevDiag) / Math.sqrt(2);
  // }

  // Transform the image
  private _transformImage(e: PointerEvent, deltaX: number): void {
    const imgElement = (e.target as any);
    const previousSize = this._previousSize(e);
    const newSize = this._newSizeConstraint(previousSize + deltaX);
    
    imgElement.style.backgroundSize = this._originalState.widthBound ? newSize + 'px auto' : 'auto ' + newSize + 'px';
  }

  // Check for previous size
  private _previousSize(e: PointerEvent): number {
    const backgroundSize = (e.target as any).style.backgroundSize;
    if (backgroundSize.indexOf(' ') > -1) {
      // backgroundSize pattern "auto 100px" or "100px auto" or "100px 200px"
      const sizeTuple = backgroundSize.split(' ');
      const size = this._originalState.widthBound ? sizeTuple[0].substring(0, sizeTuple[0].length - 2) : sizeTuple[1].substring(0, sizeTuple[1].length - 2);
      return Number(size);
    } else if (backgroundSize.indexOf('px') > -1) {
      // backgroundSize pattern "100px"
      const size = backgroundSize.substring(0, backgroundSize.length - 2);
      return Number(size);
    } else {
      return this._originalState.widthBound ? this._originalState.aw : this._originalState.ah;
    }
  }

  // If new size is below a tag bound, stop it
  private _newSizeConstraint(newSize: number): number {
    if (this._originalState.widthBound) {
      return newSize < this._originalState.aw ? this._originalState.aw : newSize;
    } else {
      return newSize < this._originalState.ah ? this._originalState.ah : newSize;
    }
  }
}