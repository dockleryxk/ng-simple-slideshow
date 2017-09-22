# NgSimpleSlideshow

A simple slideshow for Angular.

[Click here](https://ng-simple-slideshow.firebaseapp.com) the check out the demo.

![deps](https://david-dm.org/bichard/ng-simple-slideshow.svg)

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

## Options

### Inputs

| Option              | Required | Default | Type     | Description                                   |
|---------------------|----------|---------|----------|-----------------------------------------------|
| imageUrls           | yes      |         | string[] | array of image urls                           |
| height              | no       | 100%    | string   | CSS height of slideshow                       |
| autoPlay            | no       | false   | boolean  | turn autoPlay on and off                      |
| autoPlayInterval    | no       | 3333    | number   | time in ms between autoPlay slides            |
| stopAutoPlayOnSlide | no       | true    | boolean  | stop autoPlay if slideshow is interacted with |

### Output Events

| Event        | Description                     |
|--------------|---------------------------------|
| onSlideLeft  | when the left arrow is clicked  |
| onSlideRight | when the right arrow is clicked |
| onSwipeLeft  | when a swipe left occurs        |
| onSwipeRight | when a swipe right occurs       |

Note: all events emit the index number of the new slide
