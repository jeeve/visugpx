import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPointGps {
  date: Date;
  lat: number;
  lon: number;
}

@Injectable({
  providedIn: 'root'
})
export class GpxService {

  points!: IPointGps[];

  constructor(private http: HttpClient) {
    this.litFichier("https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx").subscribe({
      next: xml => { this.litXml(xml); console.log(this.points )},
      error: err => console.log(err)
    });
  }

  getPoints(): IPointGps[] {
    return this.points;
  }

  litFichier(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }

  litXml(xml: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    this.points = [];
    doc.querySelectorAll("trkpt").forEach( (elt) => {
      let t = elt.querySelector("time");
      if (t) {
        let time = t.innerHTML;
        let lat = elt.getAttribute("lat");
        let lon = elt.getAttribute("lon");
        if (lat != null && lon != null) {
          let pointGPS = { date: new Date(time), lat: parseFloat(lat), lon: parseFloat(lon) };
          this.points.push(pointGPS);
        }
      }
    });
    // tri
    this.points.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });
  }

}
