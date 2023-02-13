import { Component,  OnInit } from '@angular/core';
import { GpxService } from './gpx.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'visugpx';

  indiceFenetreMin!: number;
  indiceFenetreMax!: number;
  position = 0;

  receivePosition(position: number): void {
    this.position = position;
  }

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
  }

}
