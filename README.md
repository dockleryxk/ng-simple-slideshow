# NgSimpleSlideshow

A simple slideshow for Angular 4+.

[Click here](https://ng-simple-slideshow.firebaseapp.com) the check out the demo.

## Features

* NgSimpleSlideshow has no dependencies besides angular. All animations are 100% CSS, so @angular/animations is not needed.
* Compiled and packaged in the [Angular Package Format v4.0](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview) with [ng-packagr](https://github.com/dherges/ng-packagr).
* Compiled to es5, so this package is compatible with Angular Universal.
* AOT ready
* Responsive and captures swipes from phones and tablets

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

The simplest use case is the following, but the full list of options is below:

```html
<slideshow [imageUrls]="imageUrlArray"></slideshow>
```

## Options

### Inputs

| Option              | Required | Default         | Type     | Description                                   |
|---------------------|----------|-----------------|----------|-----------------------------------------------|
| imageUrls           | yes      | []              | string[] | array of image urls                           |
| height              | no       | '100%'          | string   | CSS height of slideshow                       |
| minHeight           | no       |                 | string   | CSS min-height of slideshow                   |
| arrowSize           | no       | '30px'          | string   | length of arrow lines                         |
| showArrows          | no       | true            | boolean  | show or hide the arrows                       |
| disableSwiping      | no       | false           | boolean  | turn swipe detection on or off                |
| autoPlay            | no       | false           | boolean  | turn autoPlay on or off                       |
| autoPlayInterval    | no       | 3333            | number   | time in ms between autoPlay slides            |
| stopAutoPlayOnSlide | no       | true            | boolean  | stop autoPlay if slideshow is interacted with |
| debug               | no       | false           | boolean  | write debugging information to the console    |
| backgroundSize      | no       | 'cover'         | string   | overwrite background-size property            |
| backgroundPosition  | no       | 'center center' | string   | overwrite background-position property        |
| backgroundRepeat    | no       | 'no-repeat'     | string   | overwrite background-repeat property          |

### Output Events

| Event        | Description                     |
|--------------|---------------------------------|
| onSlideLeft  | when the left arrow is clicked  |
| onSlideRight | when the right arrow is clicked |
| onSwipeLeft  | when a swipe left occurs        |
| onSwipeRight | when a swipe right occurs       |

Note: all events emit the index number of the new slide

### API

Take control of the slideshow if you want! Simply create a reference to your slideshow like so:

```html
<slideshow #slideshow [imageUrls]="imageUrlArray"></slideshow>
```

and in your component.ts reference it as a ViewChild:

```typescript 
@ViewChild('slideshow') slideshow: ElementRef;
```

Now you can access the public members such as the onSlide:

```typescript
this.slideshow.onSlide(1); // next slide
```

```typescript
this.slideshow.onSlide(-1); // previous slide
```
