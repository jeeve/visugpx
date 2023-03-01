import { Injectable } from '@angular/core';
import { GpxService, Vitesse } from './gpx.service';

export type Stat = {
  nom: string;
  x5: number;
  x10: number;
  v: Vitesse[];
};

type FonctionStat = (
  vitesse: Vitesse,
  reference: number,
  vitesses: Vitesse[]
) => Vitesse;

@Injectable({
  providedIn: 'root'
})
export class StatService {

  private alpha: number[] | null = [];
  
  dmax!: number;
  tmax!: number;
  vmax!: number;
  stats: Stat[] = [];

  constructor(private gpxService: GpxService) { }

  calcule() {
    this.dmax = this.gpxService.dmax;
    this.tmax = this.gpxService.tmax;
    this.vmax = this.gpxService.vmax;

    const a = [];
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      a.push(this.gpxService.pointsCalcules[i].deltaa);
    }
    this.alpha = this.movingAverage(a, 2);

    this.calculeStat('2s', this.calculeVmaxPendant.bind(this), 2);
    this.calculeStat('5s', this.calculeVmaxPendant.bind(this), 5);
    this.calculeStat('10s', this.calculeVmaxPendant.bind(this), 10);
    this.calculeStat('100m', this.calculeVmaxSur.bind(this), 0.1);
    this.calculeStat('250m', this.calculeVmaxSur.bind(this), 0.25);
    this.calculeStat('500m', this.calculeVmaxSur.bind(this), 0.5);
    this.calculeStat('1km', this.calculeVmaxSur.bind(this), 1);
    this.calculeStat('α250', this.calculeAlphaSur.bind(this), 0.25);
    this.calculeStat('α500', this.calculeAlphaSur.bind(this), 0.5);
    this.calculeStat('α1000', this.calculeAlphaSur.bind(this), 1);
  }

  private calculeStat(
    nom: string,
    fonctionStat: FonctionStat,
    parametre: number
  ) {
    const stat: Stat = { nom: nom, x5: 0, x10: 0, v: [] };
    let v0: Vitesse = { v: +Infinity, a: 0, b: 0 };
    for (let i = 0; i < 10; i++) {
      const v = fonctionStat(v0, parametre, stat.v);
      v0 = { v: v.v, a: v.a, b: v.b };
      stat.v.push(v);
    }
    this.calculeMoyennes(stat);
    this.stats.push(stat);
  }

  private calculeVmaxSur(
    vReference: Vitesse,
    distanceReference: number,
    vitesses: Vitesse[]
  ): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    let vitesse: Vitesse;
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      vitesse = this.calculeVIndiceSur(i, distanceReference);
      if (vitesse.a > -1) {
        if (
          vitesse.v > vmax.v &&
          !this.iAppartientTraces(i, vitesses, 0.1) &&
          vitesse.v < vReference.v
        ) {
          vmax.v = vitesse.v;
          vmax.a = vitesse.a;
          vmax.b = vitesse.b;
        }
      }
    }
    return vmax;
  }

  private calculeAlphaSur(
    vReference: Vitesse,
    distanceReference: number,
    vitesses: Vitesse[]
  ): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      const va = this.calculeVetAlphaIndiceSur(i, distanceReference);
      const deltai = va.vitesse.b - i;
      if (va.vitesse.a > -1) {
        if (
          va.vitesse.v > vmax.v &&
          !this.iAppartientTraces(i, vitesses, 0.1) &&
          Math.abs(va.alpha) > 180 &&
          va.ialpha > va.vitesse.a + deltai / 3 &&
          va.ialpha < va.vitesse.b - deltai / 3 && // on regarde le moment où ca tourne
          va.vitesse.v < vReference.v
        ) {
          vmax.v = va.vitesse.v;
          vmax.a = va.vitesse.a;
          vmax.b = va.vitesse.b;
        }
      }
    }
    return vmax;
  }

  private calculeVetAlphaIndiceSur(
    n: number,
    distanceReference: number
  ): { vitesse: Vitesse; alpha: number; ialpha: number } {
    let t1 = this.gpxService.pointsGps[n].date;
    let t2, dt, vitesse;
    let distance = 0;
    let alpha = 0;
    let ialpha = 0;

    for (let i = n; i < this.gpxService.pointsCalcules.length; i++) {
      if (distance >= distanceReference) {
        t2 = this.gpxService.pointsGps[i].date;
        dt = (t2.getTime() - t1.getTime()) / 1000;
        if (dt != 0) {
          vitesse = ((distance * 1000) / dt) * 1.94384;
        } else {
          vitesse = 0;
        }
        return {
          vitesse: { v: vitesse, a: n, b: i },
          alpha: alpha,
          ialpha: ialpha,
        };
      }
      if (i + 1 < this.gpxService.pointsCalcules.length) {
        distance = distance + this.gpxService.pointsCalcules[i + 1].deltad;
        if (this.alpha) {
          if (Math.abs(this.alpha[i]) < 120) {
            alpha = alpha + this.alpha[i];
          }
          if (ialpha == 0 && Math.abs(alpha) > 90) {
            ialpha = i; // on enregistre le point de bascule
          }
        }
      }
    }
    return { vitesse: { v: 0, a: -1, b: -1 }, alpha: 0, ialpha: -1 };
  }

  private calculeVmaxPendant(
    vReference: Vitesse,
    dureeeReference: number,
    vitesses: Vitesse[]
  ): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    let vitesse: Vitesse;
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      vitesse = this.calculeVIndicePendant(i, dureeeReference);
      if (vitesse.a > -1) {
        if (
          vitesse.v > vmax.v &&
          !this.iAppartientTraces(i, vitesses, 0.1) &&
          vitesse.v < vReference.v
        ) {
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
        distance = distance + this.gpxService.pointsCalcules[i + 1].deltad;
      }
    }
    return { v: 0, a: -1, b: -1 };
  }

  private movingAverage(data: number[], windowSize: number): number[] | null {
    // merci ChatGPT
    var result: number[] = [];
    var lastAvg = null;
    for (var i = 0; i < data.length; i++) {
      var start = Math.max(0, i - windowSize + 1);
      var end = i + 1;
      var sum = 0;
      for (var j = start; j < end; j++) {
        sum += data[j];
      }
      var avg = sum / (end - start);
      if (lastAvg) {
        result.push(avg != avg ? lastAvg : avg);
      }
      lastAvg = avg;
    }
    return result;
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
        distance = distance + this.gpxService.pointsCalcules[i + 1].deltad;
      }
    }
    return { v: 0, a: -1, b: -1 };
  }

  private calculeMoyennes(stat: Stat): void {
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
  private iAppartientTraces(
    i: number,
    vitesses: Vitesse[],
    marge: number
  ): boolean {
    for (let k = 0; k < vitesses.length; k++) {
      const a = vitesses[k].a;
      const da = this.gpxService.pointsCalcules[a].distance;
      const am = this.gpxService.getIndiceDistance(da - marge);
      const b = vitesses[k].b;
      const db = this.gpxService.pointsCalcules[b].distance;
      const bm = this.gpxService.getIndiceDistance(db + marge);
      if (i >= am && i <= bm) {
        return true;
      }
    }
    return false;
  }

}
