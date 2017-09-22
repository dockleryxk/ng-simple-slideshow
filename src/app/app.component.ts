import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  urls = [
    'https://cdn.vox-cdn.com/uploads/chorus_image/image/56748793/dbohn_170625_1801_0018.0.0.jpg',
    'https://cdn.vox-cdn.com/uploads/chorus_asset/file/9278671/jbareham_170917_2000_0124.jpg',
    'https://cdn.vox-cdn.com/uploads/chorus_image/image/56789263/akrales_170919_1976_0104.0.jpg',
    'https://cdn.vox-cdn.com/uploads/chorus_image/image/56674755/mr_pb_is_the_best.0.jpg'
  ];

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
