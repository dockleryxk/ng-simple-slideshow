import { IImage } from "./IImage";

export interface ISlide {
  image: IImage;
  action: string;
  leftSide: boolean;
  rightSide: boolean;
  selected: boolean;
  loaded: boolean;
}
