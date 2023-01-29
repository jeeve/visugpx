import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPointGps {
  date: string;
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
          let pointGPS = { date: time, lat: parseFloat(lat), lon: parseFloat(lon) }
          this.points.push(pointGPS);
        }
      }
    });
    // tri
    this.points.sort(function (a, b) {
      var t1 = new Date(a.date).getTime();
      var t2 = new Date(b.date).getTime();
      return t1 - t2;
    });
    
  }

}
