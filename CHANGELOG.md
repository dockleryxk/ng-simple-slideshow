# Changelog
Starting March 17, 2018 all notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Angular Universal (server side rendered) demo
- Refactor code to [this format](https://github.com/dherges/ng-packaged)

## [1.2.8] - 2019-02-06
### Changed
- Merge Pull #58 for AutoPlay option working as a Play/Pause button -- [pull](https://github.com/dockleryxk/ng-simple-slideshow/pull/58)
- Merge Pull #56 for fullscreen implementation on bindable input -- [pull](https://github.com/dockleryxk/ng-simple-slideshow/pull/56)

## [1.2.7] - unknown
### Changed
- run setInterval outside of Angular zone

## [1.2.6] - 2018-10-24
### Added
- Use trackBy in the array of images
### Changed
- Removed output aliasing
- Updated to support Angular 7

## [1.2.5] - 2018-09-15
### Added
- hideOnNoSlides which sets the container element style to display:none if no slides exists, or if the imageUrls array's length is zero
### Changed
- imageUrls array can now be empty, null, or undefined

## [1.2.4] - 2018-08-26
### Added
- backgroundPosition, backgroundRepeat, and backgroundSize props added to the IImage interface. This adds the ability to set these properties for each slide individually. These properties will default to the slideshow inputs

## [1.2.3] - 2018-07-08
### Changed
- Merge Pull #23 for custom click functions -- [pull](https://github.com/dockleryxk/ng-simple-slideshow/pull/23)
- Remove "next" and "previous" text -- [issue](https://github.com/dockleryxk/ng-simple-slideshow/issues/24)

## [1.2.2] - 2018-05-17
### Changed
- Update npm tags

## [1.2.1] - 2018-05-17
### Changed
- Fix this bug because of bad compilation -- [issue](https://github.com/dockleryxk/ng-simple-slideshow/issues/22)

## [1.2.0] - 2018-05-13
### Changed
- Update peer dependency for Angular 6

## [1.1.19] - 2018-04-18
### Changed
- imageUrl array initialized to []
- make default height 100% from the ts instead of scss

## [1.1.18] - 2018-04-14
### Changed
- actually make sure slides without hrefs don't redirect

## [1.1.17] - 2018-04-14
### Changed
- Make sure slides without hrefs don't redirect -- [bug report](https://github.com/dockleryxk/ng-simple-slideshow/pull/11#commitcomment-28466991)
- Use the document from angular core instead of the window object
- add ability to use titles in anchor tags for images
### Breaking Changes
- use a css spinner instead of a gif, remove option

## [1.1.16] - 2018-03-20
### Changed
- Fix glitchy-looking UX by removing slide from transfer state after using it once

## [1.1.15] - 2018-03-20
### Changed
- Better lazy loading for server side rendered applications

## [1.1.14] - 2018-03-20
### Changed
- Lazy loading logic now lets DOM load completely before continuing to load images

## [1.1.13] - 2018-03-20
### Changed
- Bug fix for lazy loading

## [1.1.11] - 2018-03-19
### Added
- Spinner in place of blank space while images are lazy loading
- Option for url to custom spinner gif
- Option for autoplay to wait for images to lazy load before changing slides
### Changed
- Improved lazy loading

## [1.1.10] - 2018-03-18
### Added
- Option to turn captions on or off, regardless if the slides have them

## [1.1.9] - 2018-03-18
### Added
- Lazy Loading

## [1.1.8] - 2018-03-17
### Changed
- fix async binding error -- [issue](https://github.com/dockleryxk/ng-simple-slideshow/issues/13)

## [1.1.7] - 2018-03-17
### Changed
- fix image url binding update -- [issue](https://github.com/dockleryxk/ng-simple-slideshow/issues/8)

## [1.1.6] - 2018-03-17
### Added
- Option to change dot color -- [issue](https://github.com/dockleryxk/ng-simple-slideshow/issues/15)
- Option to change caption text color
- Option to change caption background

## [1.1.5] - 2018-03-17
### Changed
- Slider as a tags instead of div tags for SEO -- [pull](https://github.com/dockleryxk/ng-simple-slideshow/pull/7)
- Optional image caption -- [pull](https://github.com/dockleryxk/ng-simple-slideshow/pull/11)

## [1.1.4] - 2018-03-17
### Added
- This changelog!

### Changed
- Updated packages to fix vulernable dependency -- [ssri](https://nvd.nist.gov/vuln/detail/CVE-2018-7651)
