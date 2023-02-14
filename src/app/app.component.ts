import { Component,  OnInit } from '@angular/core';
import { GpxService } from './gpx.service';

export type Fenetre = {
  gauche: number;
  droite: number;
}; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'visugpx';

  position: number = 0;
  fenetre: Fenetre = { gauche: 0, droite: 0 };

  majPosition(position: number): void {
    this.position = position;
  }

  majFenetre(fenetre: Fenetre): void {
    this.fenetre = fenetre;
  }

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    //this.fenetre = { gauche: 0, droite: 1000 };
  }

}
