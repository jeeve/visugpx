import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Fenetre } from '../app.component';
import { GpxService } from '../gpx.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css'],
})
export class ControlComponent implements OnInit {

  constructor (private gpxService: GpxService) {
  }

  ngOnInit(): void {
  }

}
