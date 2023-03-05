import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mergeMap, Observable, of } from 'rxjs';

export interface IPointGps {
  date: Date;
  lat: number;
  lon: number;
}

export interface IPointCalcule {
  distance: number;
  temps: number;
  vitesse: number;
  angle: number;
  deltad: number;
  deltat: number;
  deltaa: number;
}

export type UrlString = string;
export type XmlString = string;
export type Vitesse = { v: number, a: number, b: number };

@Injectable({
  providedIn: 'root',
})
export class GpxService {
  private _urlFichier: UrlString = ""; // "https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx";
  pointsGps!: IPointGps[];
  pointsCalcules!: IPointCalcule[];
  vmax!: number;
  ivmax!: number;
  dmax!: number;
  tmax!: number;
 
  private _estOK = false;

  get estOK(): boolean {
    return this._estOK;
  }

  constructor(private http: HttpClient) {
  }

  x(i: number): number {
    return this.pointsCalcules[i].distance;
  }

  get urlFichier(): UrlString {
    return this._urlFichier;
  }

  set urlFichier(newUrl: UrlString) {
    this._estOK = false;
    this._urlFichier = newUrl;
  }

  lit(): Observable<void> {
    return this.litFichier(this.urlFichier).pipe(
      mergeMap(async (xml) => this.litXml(xml))
    );
  }

  private litFichier(url: UrlString): Observable<XmlString> {
    return this.http.get(url, { responseType: 'text' });
  }

  litXml(xml: XmlString): void {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    this.pointsGps = [];
    this.pointsCalcules = [];
    this.vmax = 0;
    this.ivmax = 0;
    this.dmax = 0;
    this.tmax = 0;

    doc.querySelectorAll('trkpt').forEach((elt) => {
      let t = elt.querySelector('time');
      if (t) {
        let time = t.innerHTML;
        let lat = elt.getAttribute('lat');
        let lon = elt.getAttribute('lon');
        if (lat != null && lon != null) {
          let pointGPS = {
            date: new Date(time),
            lat: parseFloat(lat),
            lon: parseFloat(lon),
          };
          this.pointsGps.push(pointGPS);
        }
      }
    });

    // tri
    this.pointsGps.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });

    //filtre valeurs aberrante selon acceleration
    var k = 0;
    while (this.filtre() && k < 100) {
      k = k + 1;
    }

    // point calcules
    let dd = 0;
    let d = 0;
    for (let i = 0; i < this.pointsGps.length; i++) {
      if (i == 0) {
        this.pointsCalcules.push({
          distance: 0.0,
          temps: 0.0,
          vitesse: 0.0,
          angle: 0.0,
          deltad: 0.0,
          deltat: 0.0,
          deltaa: 0.0
        });
      } else {
        dd = this.calculeDistance(
          this.pointsGps[i].lat,
          this.pointsGps[i].lon,
          this.pointsGps[i - 1].lat,
          this.pointsGps[i - 1].lon
        );
        let angle = this.angleFromCoordinate(
          this.pointsGps[i - 1].lat,
          this.pointsGps[i - 1].lon,
          this.pointsGps[i].lat,
          this.pointsGps[i].lon
        );
        let vitesse = this.calculeVitesse(i, this.pointsGps);
        if (vitesse > this.vmax) {
          this.vmax = vitesse;
          this.ivmax = i;
        }
        const t0 = this.pointsGps[0].date.getTime();
        const ti = this.pointsGps[i].date.getTime();
        const deltat = (ti - this.pointsGps[i-1].date.getTime()) / 1000;
        this.pointsCalcules.push({
          distance: d,
          temps: (ti - t0) / 1000,
          vitesse: vitesse,
          angle: angle,
          deltad: dd,
          deltat: deltat,
          deltaa: this.angle360Max(angle - this.pointsCalcules[this.pointsCalcules.length-1].angle)
        });

        d = d + dd;
        this.tmax += deltat;
      }
    }

    this.dmax = d - dd;

    this._estOK = true;
  }

  private angleFromCoordinate(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    let brng = Math.atan2(lat2 - lat1, lon2 - lon1);
    brng = brng * (180 / Math.PI);
    brng = (brng + 360) % 360;
    brng = 360 - brng;
    return brng;
  }

  private angle360Max(brng: number) : number {
    brng = (brng + 360) % 360;
    brng = 360 - brng;
    return brng;
  }

  private filtre() {
    const SEUIL_ACCELERATION = 1.0;
    const SEUIL_DECELERATION = -3.5;
    var k = 1;
    var erreur = false;
    while (k < this.pointsGps.length) {
      let v0 = this.calculeVitesse(k - 1, this.pointsGps);
      let v1 = this.calculeVitesse(k, this.pointsGps);
      let t0 = this.pointsGps[k - 1].date;
      let t1 = this.pointsGps[k].date;
      let dt = (t1.getTime() - t0.getTime()) / 1000;
      let acceleration = (v1 - v0) / dt;
      if (
        acceleration > SEUIL_ACCELERATION ||
        acceleration < SEUIL_DECELERATION
      ) {
        this.pointsGps.splice(k, 1);
        erreur = true;
      }
      k = k + 1;
    }
    return erreur;
  }

  private calculeVitesse(i: number, txy: IPointGps[]) {
    if (i == 0) {
      return 0;
    }
    let dd = this.calculeDistance(
      txy[i].lat,
      txy[i].lon,
      txy[i - 1].lat,
      txy[i - 1].lon
    );
    let t1 = txy[i - 1].date;
    let t2 = txy[i].date;
    let dt = (t2.getTime() - t1.getTime()) / 1000;
    let vitesse;
    if (dt != 0) {
      vitesse = ((dd * 1000) / dt) * 1.94384;
    } else {
      vitesse = 0;
    }
    return vitesse;
  }

  calculeDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    let R = 6371; // km
    let dLat = this.toRad(lat2 - lat1);
    let dLon = this.toRad(lon2 - lon1);
    let lat1r = this.toRad(lat1);
    let lat2r = this.toRad(lat2);

    let a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(lat1r) *
        Math.cos(lat2r);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d;
  }

  private toRad(value: number) {
    return (value * Math.PI) / 180;
  }

  getIndiceDistance(x: number): number { // findClosestIndex
    const arr = this.pointsCalcules;
    let minIndex = 0;
    let maxIndex = arr.length - 1;

    while (maxIndex - minIndex > 1) {
      const midIndex = Math.floor((minIndex + maxIndex) / 2);
      if (arr[midIndex].distance === x) {
        return midIndex;
      } else if (arr[midIndex].distance > x) {
        maxIndex = midIndex;
      } else {
        minIndex = midIndex;
      }
    }

    if (
      Math.abs(arr[minIndex].distance - x) <
      Math.abs(arr[maxIndex].distance - x)
    ) {
      return minIndex;
    } else {
      return maxIndex;
    }
  }

  getIndiceTemps(d: Date): number { // findClosestUpperIndex
    const t = d.getTime();
    const arr = this.pointsGps;
    let minIndex = 0;
    let maxIndex = arr.length - 1;

    while (maxIndex - minIndex > 1) {
      const midIndex = Math.floor((minIndex + maxIndex) / 2);
      if (arr[midIndex].date.getTime() <= t) {
        minIndex = midIndex;
      } else {
        maxIndex = midIndex;
      }
    }

    if (arr[minIndex].date.getTime() >= t) {
      return minIndex;
    } else if (arr[maxIndex].date.getTime() >= t) {
      return maxIndex;
    } else {
      return arr.length;
    }
  }

  calculeIndiceLePlusPresDe = (lat: number, lng: number, marge: number): number => {
    let dmin = 1000000.0;
    let d;
    let j = 0;
    let txy = this.pointsGps;
    for (let i = 0; i < txy.length; i++) {
      d = this.calculeDistance(lat, lng, txy[i].lat, txy[i].lon);
      if (d < dmin) {
        j = i;
        dmin = d;
      }
    }
    if (dmin < marge) {
      // ne prend que si moins de 100m
      return j;
    } else {
      return -1;
    }
  };
}
