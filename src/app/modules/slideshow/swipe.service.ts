import { Injectable } from '@angular/core';

@Injectable()
export class SwipeService {
  // adapted from https://stackoverflow.com/a/44511007/1743936
  private _swipeCoord?: [number, number];
  private _swipeTime?: number;

  /**
   * @param {TouchEvent} e
   * @param {string} when
   * @returns {number}
   * @description detect the direction of the swipe, and return a -1 or 1 if the duration is long enough
   *              else return a 0 to do nothing
   */
  swipe(e: TouchEvent, when: string): number {
    const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
    const time = new Date().getTime();

    if (when === 'start') {
      this._swipeCoord = coord;
      this._swipeTime = time;
    }

    else if (when === 'end') {
      const direction = [coord[0] - this._swipeCoord[0], coord[1] - this._swipeCoord[1]];
      const duration = time - this._swipeTime;

      if (duration < 1000 // Short enough
        && Math.abs(direction[1]) < Math.abs(direction[0]) // Horizontal enough
        && Math.abs(direction[0]) > 30) {  // Long enough
        return direction[0] < 0 ? 1 : -1;
      }
    }

    return 0;
  }
}
