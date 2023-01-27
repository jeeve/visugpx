import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPointGps {
  date: string;
  lat: number;
  lon: number;
  hauteur: number;
}

@Injectable({
  providedIn: 'root'
})
export class GpxService {

  points!: IPointGps[];

  constructor(private http: HttpClient) {
    this.litFichier("https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx").subscribe({
      next: data => console.log(data),
      error: err => console.log(err)
    });
  }

  getPoints(): IPointGps[] {
    return this.points;
  }

  litFichier(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }
}
