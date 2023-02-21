import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GpxService } from './gpx.service';

export type Fenetre = {
  gauche: number;
  droite: number;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'visugpx';

  iPosition: number = 0;
  vSeuil: number = 12;
  iFenetre: Fenetre = { gauche: 0, droite: 0 };
  largeurFenetre = 2;
  fenetreAuto = true;
  visuStats = false;

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

  majVisuStats(value: boolean): void {
    this.visuStats = value;
  }

  constructor(private gpxService: GpxService) {

  }
 
  ngOnInit(): void {
    const url = this.getParameterByName("url");
    if (url) {
      this.gpxService.urlFichier = url;
    }
  }

  private getParameterByName(name: string) {
    const url = window.location.href;
    const n = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + n + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
}
