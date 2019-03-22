```prettier
 _  _      ___ _            _     ___ _ _    _        _
| \| |__ _/ __(_)_ __  _ __| |___/ __| (_)__| |___ __| |_  _____ __ __
| .` / _` \__ \ | '  \| '_ \ / -_)__ \ | / _` / -_|_-< ' \/ _ \ V  V /
|_|\_\__, |___/_|_|_|_| .__/_\___|___/_|_\__,_\___/__/_||_\___/\_/\_/
     |___/            |_|
```

A simple slideshow for Angular 4+.

[Click here](https://ng-simple-slideshow.firebaseapp.com) the check out the demo.
[Click here](https://americansecurestorage.com) the see the slideshow in production on a [StoragePug](https://storagepug.com) client site, which is what I originally made this slideshow package for.

## Features

* NgSimpleSlideshow has no dependencies besides angular. All animations are 100% CSS, so @angular/animations is not needed.
* Compiled and packaged in the [Angular Package Format v4.0](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview) with [ng-packagr](https://github.com/dherges/ng-packagr).
* Compiled to es5, so this package is compatible with Angular Universal.
* AOT ready
* Responsive and captures swipes from phones and tablets
* Lazy load option to help with initial pageload speed

## Installation

Easy, just npm install:

```shell
npm i -S ng-simple-slideshow
```

Next, import the module:

```
import {SlideshowModule} from 'ng-simple-slideshow';

@NgModule({
  imports: [
    SlideshowModule,
    ...
  ],
  declarations: [
    ...
  ],
  exports: [
    ...
  ]
})
...
```

## Usage

The simplest use case is the following:

```html
<slideshow [imageUrls]="imageUrlArray"></slideshow>
```

A more complex example of how I use this in one of my own projects (full list of options in next section):

```html
<slideshow [height]="height"
           [minHeight]="'525px'"
           [autoPlay]="true"
           [showArrows]="false"
           [imageUrls]="imageSources"
           [lazyLoad]="imageSources?.length > 1"
           [autoPlayWaitForLazyLoad]="true">
</slideshow>
```

### More Info on imageUrls

The imageUrls input can be an array of strings, however in order to enable slides to have links, captions, or custom click functions, you must use an object of type [IImage](https://github.com/dockleryxk/ng-simple-slideshow/blob/master/src/app/modules/slideshow/IImage.ts) instead of a string. For example usage, [see here](https://github.com/dockleryxk/ng-simple-slideshow/blob/master/src/app/app.component.ts#L8).

## Options

### Inputs

| Option                  | Required | Default              | Type                                                                                                                      | Description                                                                                                                        |
| ----------------------- | -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| imageUrls               | yes      | []                   | string[] or [IImage[]](https://github.com/dockleryxk/ng-simple-slideshow/blob/master/src/app/modules/slideshow/IImage.ts) | array of image urls or [IImage](https://github.com/dockleryxk/ng-simple-slideshow/blob/master/src/app/modules/slideshow/IImage.ts) |
| height                  | no       | '100%'               | string                                                                                                                    | CSS height of slideshow                                                                                                            |
| minHeight               | no       |                      | string                                                                                                                    | CSS min-height of slideshow                                                                                                        |
| arrowSize               | no       | '30px'               | string                                                                                                                    | length of arrow lines                                                                                                              |
| showArrows              | no       | true                 | boolean                                                                                                                   | show or hide the arrows                                                                                                            |
| disableSwiping          | no       | false                | boolean                                                                                                                   | turn swipe detection on or off                                                                                                     |
| autoPlay                | no       | false                | boolean                                                                                                                   | turn autoPlay on or off                                                                                                            |
| autoPlayInterval        | no       | 3333                 | number                                                                                                                    | time in ms between autoPlay slides                                                                                                 |
| stopAutoPlayOnSlide     | no       | true                 | boolean                                                                                                                   | stop autoPlay if slideshow is interacted with                                                                                      |
| autoPlayWaitForLazyLoad | no       | false                | boolean                                                                                                                   | autoplay to waits for images to lazy load before changing slides                                                                   |
| backgroundSize          | no       | 'cover'              | string                                                                                                                    | overwrite background-size property                                                                                                 |
| backgroundPosition      | no       | 'center center'      | string                                                                                                                    | overwrite background-position property                                                                                             |
| backgroundRepeat        | no       | 'no-repeat'          | string                                                                                                                    | overwrite background-repeat property                                                                                               |
| showDots                | no       | false                | boolean                                                                                                                   | show clickable dots at the bottom                                                                                                  |
| dotColor                | no       | '#FFF'               | string                                                                                                                    | color of clickable dots at the bottom                                                                                              |
| showCaptions            | no       | true                 | boolean                                                                                                                   | show or hide captions                                                                                                              |
| captionColor            | no       | '#FFF'               | string                                                                                                                    | color of caption text                                                                                                              |
| captionBackground       | no       | 'rgba(0, 0, 0, .35)' | string                                                                                                                    | color of caption background                                                                                                        |
| lazyLoad                | no       | false                | boolean                                                                                                                   | turn on to lazy load images instead of preload                                                                                     |
| hideOnNoSlides          | no       | false                | boolean                                                                                                                   | set the slideshow container display to none if imageUrls is empty, null, or undefined                                              |
| fullscreen              | no       | false                | boolean                                                                                                                   | activate full screen for the slideshow on true, go back to normal view on false                                                    |

### Output Events

| Event        | Description                     |
| ---------------- | ------------------------------- |
| onSlideLeft      | when the left arrow is clicked  |
| onSlideRight     | when the right arrow is clicked |
| onSwipeLeft      | when a swipe left occurs        |
| onSwipeRight     | when a swipe right occurs       |
| onFullscreenExit | when fullscreen exits           |
| onIndexChanged   | when slide index changes        |

Note: all events emit the index number of the new slide

### API

Take control of the slideshow if you want! Simply create a reference to your slideshow like so:

```html
<slideshow #slideshow [imageUrls]="imageUrlArray"></slideshow>
```

and in your component.ts reference it as a ViewChild:

```typescript
@ViewChild('slideshow') slideshow: any;
```

Now you can access the public members such as the goToSlide and onSlide:

```typescript
this.slideshow.goToSlide(3); // go to slide index 3 (i.e. imageUrls[3])
```

```typescript
this.slideshow.onSlide(1); // next slide
```

```typescript
this.slideshow.onSlide(-1); // previous slide
```
