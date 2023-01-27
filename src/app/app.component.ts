import { Component, OnInit } from '@angular/core';
import { IPointGps } from './gpx';
import { GpxService } from './gpx.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'visugpx';

  points!: IPointGps[];

  constructor(private gpxService: GpxService) {

  }

  ngOnInit(): void {
    this.points = this.gpxService.getPoints();
  }
}
