import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Fenetre } from '../app.component';
import { GpxService } from '../gpx.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css'],
})
export class ControlComponent implements OnInit {
  vmax!: number;
  vitesse!: number;
  distanceSeuil!: number;
  rapidite = 10;
  private intervalSubscription!: Subscription;

  private _vSeuil = 0;

  @Output()
  seuilChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get vSeuil(): number {
    return this._vSeuil;
  }

  set vSeuil(value: number) {
    this._vSeuil = value;
    this.seuilChange.emit(value);
    this.distanceSeuil = this.calculeDistanceSeuil();
  }

  private _iPosition = 0;

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get iPosition(): number {
    return this._iPosition;
  }

  set iPosition(value: number) {
    this._iPosition = value;
    if (this.gpxService.estOK) {
      this.vitesse = this.gpxService.pointsCalcules[this._iPosition].vitesse;
    }
    this.positionChange.emit(value);
  }

  get xPosition(): number {
    if (this.gpxService.estOK) {
      return this.gpxService.pointsCalcules[this._iPosition].distance;
    } else {
      return 0;
    }
  }

  set xPosition(value: number) {
    if (this.gpxService.estOK) {
      this._iPosition = this.gpxService.getIndiceDistance(value);
      this.positionChange.emit(this._iPosition);
    }
  }

  private _largeurFenetre = 2;

  @Output()
  largeurFenetreChange: EventEmitter<number> = new EventEmitter<number>();

  get largeurFenetre(): number {
    return this._largeurFenetre;
  }

  set largeurFenetre(value: number) {
    this._largeurFenetre = value;
    this.largeurFenetreChange.emit(value);
  }

  private _fenetreAuto = true;

  @Output()
  fenetreAutoChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input()
  get fenetreAuto(): boolean {
    return this._fenetreAuto;
  }

  set fenetreAuto(value: boolean) {
    this._fenetreAuto = value;
    this.fenetreAutoChange.emit(value);
  }

  constructor(private gpxService: GpxService) {}

  ngOnInit(): void {
    this.gpxService.lit().subscribe(() => {
      this.vmax = this.gpxService.vmax;
      this.iPosition = 0;
      this.distanceSeuil = this.calculeDistanceSeuil();
    });
  }

  lecture(): void {
    this.intervalSubscription = interval(1000/this.rapidite).subscribe(() => { 
      let d = this.gpxService.pointsGps[this._iPosition].date;
      d.setTime(d.getTime() + 1000);
      const i = this.gpxService.getIndiceTemps(d);
      if (i < this.gpxService.pointsGps.length) {
        this.iPosition = i;
      }
    });
  }

  stop(): void {
    this.intervalSubscription.unsubscribe();
  }
  
  rapiditeChange(): void {
    if (!this.intervalSubscription.closed) {
      this.intervalSubscription.unsubscribe();
      this.lecture();
    }
  }

  private calculeDistanceSeuil(): number {
    if (this.gpxService.estOK) {
      let distance = 0;
      let delta;
      for (let i = 1; i < this.gpxService.pointsCalcules.length; i++) {
        if (this.gpxService.pointsCalcules[i].vitesse >= this._vSeuil) {
          delta = this.gpxService.pointsCalcules[i].deltad;
          distance += delta;
        }
      }
      return distance;
    } else {
      return 0;
    }
  }
}
