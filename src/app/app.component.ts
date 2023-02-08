import { Component, Input, OnInit, Output } from '@angular/core';
import { GpxService } from './gpx.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'visugpx';

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
  }

  get position(): number {
    return this.gpxService.indicePosition
  }

  set position(value: number) {
    this.gpxService.indicePosition = value;
  }

}
