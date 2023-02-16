import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Fenetre } from '../app.component';
import { GpxService } from '../gpx.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css'],
})
export class ControlComponent implements OnInit {
  private _iPosition = 0;

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get iPosition(): number {
    return this._iPosition;
  }

  set iPosition(value: number) {
    this._iPosition = value;
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

  constructor(private gpxService: GpxService) {}

  ngOnInit(): void {}
}
