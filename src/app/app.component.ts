import { Component, OnInit, ViewChild } from '@angular/core';
import { GpxService } from './gpx.service';
import { MapComponent } from './map/map.component';

export class Fenetre {
  a = 0.0;
  b = 0.0;
  auto = true;
  largeur = 2;

  constructor(private gpxService: GpxService) {
  }

  calcule(i: number): void {
    if (this.auto) {
      if (!this.gpxService.estOK) return;
      const d = this.gpxService.pointsCalcules[i].distance;
      this.a = this.gpxService.getIndiceDistance(d - this.largeur / 2);
      this.b = this.gpxService.getIndiceDistance(d + this.largeur / 2);
      if (this.a < 0) {
        this.a = 0;
      }
      if (this.b > this.gpxService.pointsCalcules.length - 1) {
        this.b = this.gpxService.pointsCalcules.length - 1;
      }
    }
  }
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
  fenetre: Fenetre = new Fenetre(this.gpxService);
  visuStats = true;
  visuChutes = true;
  calculStatsOk = false;
  iStat = -1;

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
    this.mapComponent.dessineTrace();
  }

  majVisuStats(value: boolean): void {
    this.visuStats = value;
  }

  majVisuChutes(value: boolean): void {
    this.visuChutes = value;
  }

  majiStat(value: number): void {
    this.iStat = value;
  }

  majCalculStatsOk(value: boolean) {
    this.calculStatsOk = value;
  }

  @ViewChild(MapComponent) mapComponent!: MapComponent;

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
