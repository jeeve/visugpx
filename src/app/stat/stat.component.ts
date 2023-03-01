import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GpxService, Vitesse } from '../gpx.service';
import { Stat, StatService } from '../stat.service';

export const couleursStat = [
  'red',
  'blue',
  'blueviolet',
  'green',
  'coral',
  'deeppink',
  'dodgerblue',
  'lightseagreen',
  'gold',
  'lightpink',
];

@Component({
  selector: 'app-stat',
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.css'],
})
export class StatComponent implements OnInit {
  get dmax(): number {
    return this.statService.dmax;
  }
  get vmax(): number {
    return this.statService.vmax;
  }
  get tmax(): number {
    return this.statService.tmax;
  }
  stats: Stat[] = [];
  _iStat = -1;
  calculOK = false;

  @Input()
  visuStats!: boolean;

  @Output()
  statChange: EventEmitter<Stat | null> = new EventEmitter<Stat | null>();

  get stat(): Stat | null {
    if (this._iStat > -1) {
      return this.statService.stats[this._iStat];
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

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  constructor(private gpxService: GpxService, private statService: StatService) {}

  ngOnInit(): void {
    this.gpxService.lit().subscribe(() => {
      this.statService.calcule();
      this.stats = this.statService.stats;
      this.calculOK = true;
    });
  }

  ligneClick(i: number) {
    this.iStat = i;
  }

  valeurClick(i: number, j: number) {
    this._iStat = i;
    if (this.stat) {
      if (this.stat) {
        this.positionChange.emit(this.stat.v[j].a); // marker au point de depart de la ligne
      }
    }
  }

}
