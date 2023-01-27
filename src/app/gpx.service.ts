import { Injectable } from '@angular/core';
import { Gpx, IPointGps } from './gpx';

@Injectable({
  providedIn: 'root'
})
export class GpxService {

  constructor(private gpx: Gpx) { }

  getPoints(): IPointGps[] {
    return this.gpx.points;
  }
}
