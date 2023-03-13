import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Fenetre } from '../app.component';
import { GpxService } from '../gpx.service';
import { StatService } from '../stat.service';
import { UploadService } from '../upload.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css'],
})
export class ControlComponent implements OnInit {
  @Input()
  estOK = false;

  @Input()
  afficheFenetre = true;

  @Input()
  get afficheBoutonChutes(): boolean {
    if (this.statService.calculOK) {
      if (this.statService.chutes.length == 0) {
        return false;
      }
    }
    return true;
  }

  uploadGpx = false;
  _visuStats = true;
  _visuChutes = true;
  _visuGraphDistance = true;
  _visuGraphTemps = false;
  vmax!: number;
  vitesse!: number;
  distanceSeuil!: number;
  rapidite = 10;
  private intervalSubscription!: Subscription;

  clickUploadGpx(): void {
    this.uploadGpx = !this.uploadGpx;
  }

  private _vSeuil = 0;

  @Output()
  visuStatsChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  get visuStats(): boolean {
    return this._visuStats;
  }

  set visuStats(value: boolean) {
    this._visuStats = value;
    this.visuStatsChange.emit(value);
  }

  @Output()
  visuChutesChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  get visuChutes(): boolean {
    return this._visuChutes;
  }

  set visuChutes(value: boolean) {
    this._visuChutes = value;
    this.visuChutesChange.emit(value);
  }

  @Output()
  visuGraphDistanceChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  get visuGraphDistance(): boolean {
    return this._visuGraphDistance;
  }

  set visuGraphDistance(value: boolean) {
    this._visuGraphDistance = value;
    this.visuGraphDistanceChange.emit(value);
  }

  @Output()
  visuGraphTempsChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  get visuGraphTemps(): boolean {
    return this._visuGraphTemps;
  }

  set visuGraphTemps(value: boolean) {
    this._visuGraphTemps = value;
    this.visuGraphTempsChange.emit(value);
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

  get tPosition(): number {
    if (this.gpxService.estOK) {
      return this.gpxService.pointsCalcules[this._iPosition].temps;
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

  @Input()
  fenetre!: Fenetre;

  @Output()
  fenetreChange: EventEmitter<void> = new EventEmitter<void>();

  file!: File;

  onFilechange(event: any) {
    console.log(event.target.files[0]);
    this.file = event.target.files[0];
  }

  upload() {
    if (this.file) {
      this.uploadService.uploadfile(this.file).subscribe((res: any) => {
        console.log(res);
        window.location.href = res;
      });
    }
  }

  metAjourFenetre() {
    this.fenetre.calcule(this._iPosition);
    this.fenetreChange.emit();
  }

  constructor(
    private gpxService: GpxService,
    private uploadService: UploadService,
    private statService: StatService
  ) {}

  ngOnInit(): void {
    this.gpxService.lit().subscribe(() => {
      if (this.gpxService.estOK) {
        this.vmax = this.gpxService.vmax;
        this.iPosition = 0;
        this.distanceSeuil = this.calculeDistanceSeuil();
      }
    });
  }

  lecture(): void {
    if (this.intervalSubscription)
      if (!this.intervalSubscription.closed) return;
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
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
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
