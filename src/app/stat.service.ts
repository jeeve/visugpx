import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  providedIn: 'root',
})
export class StatService {
  // private alpha: number[] | null = [];

  dmax!: number;
  tmax!: number;
  vmax!: number;
  ivmax!: number;
  stats: Stat[] = [];
  chutes: number[] = [];
  calculOK = false;

  constructor(private gpxService: GpxService) {}

  calcule(): Observable<void> {
    return new Observable((observer) => {
      if (this.calculOK) {
        observer.next();
        observer.complete();
      }

      this.gpxService.lit().subscribe(() => {
        this.dmax = this.gpxService.dmax;
        this.tmax = this.gpxService.tmax;
        this.vmax = this.gpxService.vmax;
        this.ivmax = this.gpxService.ivmax;

        const a = [];
        for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
          a.push(this.gpxService.pointsCalcules[i].deltaa);
        }
        //this.alpha = this.movingAverage(a, 2);

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

        this.calculeChutes();

        this.calculOK = true;

        observer.next();
        observer.complete();
      });
    });
  }

  private calculeChutes(): void {
    this.chutes = [];
    for (let i = 1; i < this.gpxService.pointsCalcules.length; i++) {
      const v0 = this.gpxService.pointsCalcules[i - 1].vitesse;
      const v = this.gpxService.pointsCalcules[i].vitesse;
      if (v < 5) {
        const dt = this.gpxService.pointsCalcules[i - 1].deltat;
        const deltav = (v - v0) / dt;
        if (v0 > 12 && deltav < -3) {
          if (!this.chuteAmoinDe(i - 1, 30)) {
            this.chutes.push(i);
          }
        }
      }
    }
  }

  private chuteAmoinDe(i: number, deltat: number): boolean {
    const ti = this.gpxService.pointsCalcules[i].temps;
    for (let c = 0; c < this.chutes.length; c++) {
      const tc = this.gpxService.pointsCalcules[this.chutes[c]].temps;
      if (ti - tc <= deltat) {
        return true;
      }
    }
    return false;
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
    let headings: number[] = [];
    let turns: number[] = [];
    const n = this.gpxService.pointsCalcules.length;
    const pts = this.gpxService.pointsGps;
    // calcule le heading lissé pour chaque point à partir d'un segment
    // de ~5 points (évite le bruit GPS des angles point-à-point)
    const demiF = 4;
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - demiF);
      const i1 = Math.min(n - 1, i + demiF);
      const dlat = pts[i1].lat - pts[i0].lat;
      const dlon = (pts[i1].lon - pts[i0].lon) * Math.cos(pts[i].lat * Math.PI / 180);
      let brng = Math.atan2(dlat, dlon) * (180 / Math.PI);
      brng = (brng + 360) % 360;
      headings.push(brng);
    }
    // moyenne circulaire pour gérer correctement le passage 0°/360°
    let sumSin = 0;
    let sumCos = 0;
    for (let i = 0; i < n; i++) {
      const rad = headings[i] * Math.PI / 180;
      sumSin += Math.sin(rad);
      sumCos += Math.cos(rad);
    }
    const meanHeading = Math.atan2(sumSin, sumCos) * 180 / Math.PI;
    for (let i = 0; i < n; i++) {
      let diff = headings[i] - meanHeading;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      headings[i] = diff;
    }
    let deltad = 0;
    let lastSignificantSide = 0; // -1 = côté négatif, +1 = côté positif
    const seuilAngle = 20; // seuil en degrés pour éviter les faux jibes
    for (let i = 1; i < this.gpxService.pointsCalcules.length; i++) {
      deltad += this.gpxService.pointsCalcules[i].deltad;
      // détecte un vrai jibe : le heading était significativement d'un côté
      // et passe significativement de l'autre
      const isJibe =
        (lastSignificantSide === -1 && headings[i] > seuilAngle) ||
        (lastSignificantSide === 1 && headings[i] < -seuilAngle);
      if (
        isJibe &&
        !this.iAppartientTraces(i, vitesses, 0.1)
      ) {
        if (turns.length > 0) {
          if (deltad > distanceReference + distanceReference / 2) {
            turns.push(i - 1);
            deltad = 0;
          }
        } else {
          turns.push(i - 1);
          deltad = 0;
        }
      }
      // met à jour le côté significatif après la détection
      if (headings[i] < -seuilAngle) lastSignificantSide = -1;
      else if (headings[i] > seuilAngle) lastSignificantSide = 1;
    }
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    // changement de direction minimum (degrés) pour valider un jibe
    // 90° correspond au standard GPS-Speedsurfing
    const seuilJibe = 90;
    for (let i = 0; i < turns.length; i++) {
      let a, b: number;
      let jibe = [];
      let j = turns[i];

      while (
        j < this.gpxService.pointsGps.length &&
        this.gpxService.calculeDistance(
          this.gpxService.pointsGps[turns[i]].lat,
          this.gpxService.pointsGps[turns[i]].lon,
          this.gpxService.pointsGps[j].lat,
          this.gpxService.pointsGps[j].lon
        ) <
          distanceReference / 2
      ) {
        jibe.push(j); // ajoute les points après jibe
        j++;
      }
      b = j - 1;
      j = turns[i] - 1;
      while (
        j >= 0 &&
        this.gpxService.calculeDistance(
          this.gpxService.pointsGps[turns[i]].lat,
          this.gpxService.pointsGps[turns[i]].lon,
          this.gpxService.pointsGps[j].lat,
          this.gpxService.pointsGps[j].lon
        ) <
          distanceReference / 2
      ) {
        jibe.push(j); // ajoute les points avant le jibe
        j--;
      }
      a = j + 1;

      // valide le jibe en comparant le heading aux bornes réelles du jibe
      // (aux points a et b qui sont à distanceReference/2 du virage)
      if (a >= n || b >= n || a === b) continue;
      let diffJibe = headings[b] - headings[a];
      while (diffJibe > 180) diffJibe -= 360;
      while (diffJibe < -180) diffJibe += 360;
      if (Math.abs(diffJibe) < seuilJibe) continue;

      let d = 0;
      let t = 0;
      for (let k = 0; k < jibe.length; k++) {
        d += this.gpxService.pointsCalcules[jibe[k]].deltad;
        t += this.gpxService.pointsCalcules[jibe[k]].deltat;
      }
      let v = (1.94384 * d * 1000) / t; // vitesse moyenne du jibe
      if (v > vmax.v && v < vReference.v) {
        vmax.v = v;
        vmax.a = a; // debut du jibe
        vmax.b = b; // fin du jibe
      }
    }

    return vmax;
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
