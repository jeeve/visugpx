import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GpxService, Vitesse } from '../gpx.service';

export type Stat = { nom: string, x5: number, x10: number, v: Vitesse[], indiceSelection: number };
export const couleursStat = ["blue", "blueviolet", "chartreuse", "cyan", "coral", "crimson", "darksalmon", "darkseagreen", "deeppink", "darkgreen"];

@Component({
  selector: 'app-stat',
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.css']
})
export class StatComponent implements OnInit {

  @Input()
  visuStats!: boolean;
  dmax!: number;
  vmax!: number;
  stats: Stat[] = [];
  _iStat = -1;

  @Output()
  statChange: EventEmitter<Stat | null> = new EventEmitter<Stat | null>();

  get stat(): Stat | null {
    if (this._iStat > -1) {
      return this.stats[this._iStat];
    } else {
      return null;
    }
  }

  @Input()
  set stat(value: Stat | null) {
    if (value == null) {
      this._iStat = -1;
    }
  }

  get iStat(): number {
    return this._iStat;
  }

  set iStat(value: number) {
    this._iStat = value;
    this.statChange.emit(this.stat);
  }

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    this.gpxService.lit().subscribe(() => {
      this.calcule();
    });
  }

  ligneClick(i: number) {
    this.iStat = i;
  }

  valeurClick(i: number, j: number) {
    this._iStat = i;
    if (this.stat) {
      this.stat.indiceSelection = j;
      this.statChange.emit(this.stat); 
    }
  }

  calcule(): void {
    this.dmax = this.gpxService.dmax;
    this.vmax = this.gpxService.vmax;
    this.calculeStat('2s', this.calculeVmaxPendant.bind(this), 2);
    this.calculeStat('5s', this.calculeVmaxPendant.bind(this), 5);
    this.calculeStat('10s', this.calculeVmaxPendant.bind(this), 10);
    this.calculeStat('100m', this.calculeVmaxSur.bind(this), 0.1);
    this.calculeStat('100m', this.calculeVmaxSur.bind(this), 0.25);
    this.calculeStat('500m', this.calculeVmaxSur.bind(this), 0.5);
    this.calculeStat('1km', this.calculeVmaxSur.bind(this), 1);
  }

  private calculeStat(nom: string, methode: Function, parametre: number) {
    const stat: Stat = { nom: nom, x5: 0, x10: 0, v: [], indiceSelection: 0 };
    let v0: Vitesse = { v: +Infinity, a: -1, b: -1 };
    for (let i = 0; i < 10; i++) {
      const v = methode(v0, parametre);
      v0 = v;
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

  private calculeVmaxSur(vReference: Vitesse, distanceReference: number): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    let vitesse: Vitesse;
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      vitesse = this.calculeVIndiceSur(i, distanceReference);
      if (vitesse.a > -1) {
        const deltai = Math.abs(vitesse.a - vReference.a);
        if (vitesse.v > vmax.v && deltai> 50 && vitesse.v < vReference.v) {
          vmax.v = vitesse.v;
          vmax.a = vitesse.a;
          vmax.b = vitesse.b;
        }
      }
    }
    return vmax;
  }

  private calculeVmaxPendant(vReference: Vitesse, dureeeReference: number): Vitesse {
    let vmax: Vitesse = { v: 0, a: 0, b: 0 };
    let vitesse: Vitesse;
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      vitesse = this.calculeVIndicePendant(i, dureeeReference);
      if (vitesse.a > -1) {
        const deltai = Math.abs(vitesse.a - vReference.a);
        if (vitesse.v > vmax.v && deltai> 50 && vitesse.v < vReference.v) {
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
