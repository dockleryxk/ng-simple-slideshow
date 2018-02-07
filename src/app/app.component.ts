import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  imageUrls = [
    { image: 'https://cdn.vox-cdn.com/uploads/chorus_image/image/56748793/dbohn_170625_1801_0018.0.0.jpg', href: "#a" },
    { image: 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/9278671/jbareham_170917_2000_0124.jpg', href: "#b" },
    { image: 'https://cdn.vox-cdn.com/uploads/chorus_image/image/56789263/akrales_170919_1976_0104.0.jpg', href: "#c" },
    { image: 'https://cdn.vox-cdn.com/uploads/chorus_image/image/56674755/mr_pb_is_the_best.0.jpg', href: "#d" }
  ];
  height: string = '400px';
  minHeight: string;
  arrowSize: string = '30px';
  showArrows: boolean = true;
  disableSwiping: boolean = false;
  autoPlay: boolean = true;
  autoPlayInterval: number = 3333;
  stopAutoPlayOnSlide: boolean = true;
  debug: boolean = true;
  backgroundSize: string = 'cover';
  backgroundPosition: string = 'center center';
  backgroundRepeat: string = 'no-repeat';
  showDots: boolean = false;
  width: string = '100%';

  ngOnInit() {
    console.log(`
                                  /   \\       
 _                        )      ((   ))     (
(@)                      /|\\      ))_((     /|\\
|-|                     / | \\    (/\\|/\\)   / | \\                      (@)
| | -------------------/--|-voV---\`|'/---Vov-|--\\---------------------|-|
|-|                         '^\`   (o o)  '^\`                          | |
| |                               \`\\Y/'                               |-|
|-|                                                                   | |
| |                                Hey                                |-|
|-|                                                                   | |
| |                                                                   |-|
|_|___________________________________________________________________| |
(@)              l   /\\ /         ( (       \\ /\\   l                \`\\|-|
                 l /   V           \\ \\       V   \\ l                  (@)
                 l/                _) )_          \\I
                                   \`\\ /'
				                     \`
    `);
  }
}
