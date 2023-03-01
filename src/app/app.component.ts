import { Component, OnInit } from '@angular/core';
import { GpxService } from './gpx.service';
import { Stat } from './stat.service';

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

  estOK = false;
  iPosition: number = 0;
  vSeuil: number = 12;
  iFenetre: Fenetre = { gauche: 0, droite: 0 };
  largeurFenetre = 2;
  fenetreAuto = true;
  visuStats = true;
  stat!: Stat | null;

  get ecranMini(): boolean {
    return document.body.clientWidth <= 767; 
  }

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

  majStat(value: Stat | null): void {
    const s = value;
    if (s) {
      this.stat = { nom: s.nom, x5: s.x5, x10: s.x10, v: [...s.v] };
    } else {
      this.stat = null;
    }
  }
  constructor(private gpxService: GpxService) {}

  ngOnInit(): void {
    const url = this.getParameterByName('url');
    if (url) {
      if (url != '') {
        this.gpxService.urlFichier = url;
        this.estOK = true;
      }
    }
  }

  private getParameterByName(name: string) {
    const url = window.location.href;
    const n = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + n + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
}
