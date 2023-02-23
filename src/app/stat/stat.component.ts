import { Component, OnInit } from '@angular/core';
import { GpxService, Vitesse } from '../gpx.service';

type Stat = { nom: string, x5: number, x10: number, v: Vitesse[] };

@Component({
  selector: 'app-stat',
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.css']
})
export class StatComponent implements OnInit {

  stats: Stat[] = [];

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    this.gpxService.lit().subscribe(() => {
      this.calcule();
    });
  }

  calcule(): void {
    this.calculeStat('2s', this.calculeVmaxPendant.bind(this), 2);
    this.calculeStat('5s', this.calculeVmaxPendant.bind(this), 5);
    this.calculeStat('10s', this.calculeVmaxPendant.bind(this), 10);
    this.calculeStat('100m', this.calculeVmaxSur.bind(this), 0.1);
    this.calculeStat('500m', this.calculeVmaxSur.bind(this), 0.5);
    this.calculeStat('1km', this.calculeVmaxSur.bind(this), 1);
  }

  private calculeStat(nom: string, methode: Function, parametre: number) {
    const stat: Stat = { nom: nom, x5: 0, x10: 0, v: [] };
    let v0 = +Infinity;
    for (let i = 0; i < 10; i++) {
      const v = methode(v0, parametre);
      v0 = v.v;
      stat.v.push(v);
    }
    this.calculeMoyennes(stat);
    this.stats.push(stat);  
  }

  private calculeMoyennes(stat : Stat): void {
    let s = 0;
    for (let i = 0; i < 5; i++) {
      s += stat.v[i].v;
    }
    stat.x5 = s / 5;
    s = 0;
    for (let i = 0; i < 10; i++) {
      s += stat.v[i].v;
    }
    stat.x10 = s / 10;  
  }

  private calculeVmaxSur(vReference: number, distanceReference: number): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    let vitesse: Vitesse;
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      vitesse = this.calculeVIndiceSur(i, distanceReference);
      if (vitesse.a > -1) {
        if (vitesse.v > vmax.v && vitesse.v < vReference) {
          vmax.v = vitesse.v;
          vmax.a = vitesse.a;
          vmax.b = vitesse.b;
        }
      }
    }
    return vmax;
  }

  private calculeVmaxPendant(vReference: number, dureeeReference: number): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    let vitesse: Vitesse;
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      vitesse = this.calculeVIndicePendant(i, dureeeReference);
      if (vitesse.a > -1) {
        if (vitesse.v > vmax.v && vitesse.v < vReference) {
          vmax.v = vitesse.v;
          vmax.a = vitesse.a;
          vmax.b = vitesse.b;
        }
      }
    }
    return vmax;
  }

  private calculeVIndiceSur(n: number, distanceReference: number): Vitesse {
    let t1 = this.gpxService.pointsGps[n].date;
    let t2, dt, vitesse;
    let distance = 0;
    for (let i = n; i < this.gpxService.pointsCalcules.length; i++) {
      if (distance >= distanceReference) {
        t2 = this.gpxService.pointsGps[i].date;
        dt = (t2.getTime() - t1.getTime()) / 1000;
        if (dt != 0) {
          vitesse = ((distance * 1000) / dt) * 1.94384;
        } else {
          vitesse = 0;
        }
        return { v: vitesse, a: n, b: i };
      }
      if (i + 1 < this.gpxService.pointsCalcules.length) {
        distance = distance + this.gpxService.pointsCalcules[i+1].deltad;
      }
    }
    return { v: 0, a: -1, b: -1 };
  }

  private calculeVIndicePendant(n: number, dureeReference: number): Vitesse {
    let t1 = this.gpxService.pointsGps[n].date;
    let t2, dt, vitesse;
    let distance = 0;
    for (let i = n; i < this.gpxService.pointsCalcules.length; i++) {
      t2 = this.gpxService.pointsGps[i].date;
      dt = (t2.getTime() - t1.getTime()) / 1000;
      if (dt >= dureeReference) {
        if (dt != 0) {
          vitesse = ((distance * 1000) / dt) * 1.94384;
        } else {
          vitesse = 0;
        }
        return { v: vitesse, a: n, b: i };
      }
      if (i + 1 < this.gpxService.pointsCalcules.length) {
        distance = distance + this.gpxService.pointsCalcules[i+1].deltad;
      }
    }
    return { v: 0, a: -1, b: -1 };
  }

}
