import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { GpxService, Stats } from '../gpx.service';
import { UploadService } from '../upload.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css'],
})
export class ControlComponent implements OnInit {
  @Input()
  estOK = false;

  uploadGpx = false;
  _visuStats = false;
  vmax!: number;
  vitesse!: number;
  distanceSeuil!: number;
  rapidite = 10;
//  stats!: Stats;
  private intervalSubscription!: Subscription;
  _tabVisuStats: boolean[] = [true, true, true, true, true, true];

  clickUploadGpx(): void {
    this.uploadGpx = !this.uploadGpx;
  }

  private _vSeuil = 0;

  @Input()
  changeTabVisuStats() {
    this.tabVisuStatsChange.emit(this._tabVisuStats);
  }

  @Output()
  visuSatsChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  get visuStats(): boolean {
    return this._visuStats;
  }

  set visuStats(value: boolean) {
    this._visuStats = value;
    this.visuSatsChange.emit(value);
  }

  @Output()
  tabVisuStatsChange: EventEmitter<boolean[]> = new EventEmitter<boolean[]>();

  get tabVisuStats(): boolean[] {
    return this._tabVisuStats;
  }

  set tabVisuStats(value: boolean[]) {
    this._tabVisuStats = value;
    this.tabVisuStatsChange.emit(value);
  }

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

  file!: File;

  onFilechange(event: any) {
    console.log(event.target.files[0])
    this.file = event.target.files[0]
  }
  
  upload() {
    if (this.file) {
      this.uploadService.uploadfile(this.file).subscribe((res: any) => {
        console.log(res);
        window.location.href = res;
      })
    }
  }

  constructor(private gpxService: GpxService, private uploadService: UploadService) {}

  ngOnInit(): void {
    this.gpxService.lit().subscribe(() => {
      if (this.gpxService.estOK) {
        this.vmax = this.gpxService.vmax;
        this.iPosition = 0;
        this.distanceSeuil = this.calculeDistanceSeuil();
        //this.gpxService.calculeStats();
        //this.stats = this.gpxService.stats;
      }
    });
  }

  lecture(): void {
    this.intervalSubscription = interval(1000 / this.rapidite).subscribe(() => {
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
