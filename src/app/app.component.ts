import { Component,  OnInit } from '@angular/core';
import { GpxService, UrlString } from './gpx.service';

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

  iPosition: number = 0;
  vSeuil: number = 12;
  iFenetre: Fenetre = { gauche: 0, droite: 0 };
  urlFichier: UrlString = 'https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx';

  majPosition(position: number): void {
    this.iPosition = position;
  }

  majSeuil(seuil: number): void {
    this.vSeuil = seuil;
  }

  majFenetre(fenetre: Fenetre): void {
    this.iFenetre = fenetre;
  }

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    this.gpxService.urlFichier = this.urlFichier;
  }

}
