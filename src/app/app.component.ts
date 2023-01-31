import { Component, OnInit } from '@angular/core';
import { GpxService, IPointGps } from './gpx.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'visugpx';

  pointsGps!: IPointGps[];

  constructor(private gpxService: GpxService) {

  }

  ngOnInit(): void {
    this.pointsGps = this.gpxService.pointsGps;
  }
}
