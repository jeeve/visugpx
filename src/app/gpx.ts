import { Injectable } from "@angular/core";

export interface IPointGps {
    date: string;
    lat: number;
    lon: number;
    hauteur: number;
}

export interface IGpx {

    points: IPointGps[];

}

@Injectable({
    providedIn: 'root'
  })
export class Gpx implements IGpx {

    points!: IPointGps[];

    constructor() {
        this.litFichier("https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx");
    }

    litFichier(url : string): void {

    }


}