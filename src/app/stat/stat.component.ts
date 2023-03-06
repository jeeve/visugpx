import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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

  _iStat = -1;

  @Input()
  visuStats!: boolean;

  calculOk = false;

  @Output()
  iStatChange: EventEmitter<number> = new EventEmitter<number>();

  get iStat(): number {
    return this._iStat;
  }

  @Input()
  set iStat(value: number) {
    this._iStat = value;
    this.iStatChange.emit(value);
  }

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  get stats(): Stat[] {
    return this.statService.stats;
  }
  
  constructor(private statService: StatService) {}

  ngOnInit(): void {
    this.statService.calcule().subscribe(() => { this.calculOk = true; })
  }

  ligneClick(i: number) {
    this.iStat = i;
  }

  valeurClick(i: number, j: number) {
    this.iStat = i;
    if (this.iStat > -1) {
      this.positionChange.emit(this.statService.stats[this.iStat].v[j].a); // marker au point de depart de la ligne
    }
  }

}
