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

  urlFichier: UrlString = 'https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx';
  iPosition: number = 0;
  vSeuil: number = 12;
  iFenetre: Fenetre = { gauche: 0, droite: 0 };
  largeurFenetre = 2;
  fenetreAuto = true;

  majPosition(position: number): void {
    this.iPosition = position;
  }

  majSeuil(seuil: number): void {
    this.vSeuil = seuil;
  }

  majFenetre(fenetre: Fenetre): void {
    this.iFenetre = fenetre;
  }

  majFenetreAuto(value: boolean): void {
    this.fenetreAuto = value;
  }

  majLargeurFenetre(value: number): void {
    this.largeurFenetre = value;
  }

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    this.gpxService.urlFichier = this.urlFichier;
  }

}
