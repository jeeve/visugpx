import {
  AfterViewInit,
  Component,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-rotatedmarker';
import { Fenetre } from '../app.component';
import { GpxService, Vitesse } from '../gpx.service';
import { Stat, StatService } from '../stat.service';
import { couleursStat } from '../stat/stat.component';

type DessinTraceStat = {
  ligne: L.Polyline;
  flecheA: L.Marker;
  flecheB: L.Marker;
};

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit {
  private _visuStats = false;
  private _visuChutes = false;
  private map!: L.Map;
  private trace!: L.LayerGroup;
  private markerVitesse!: L.Marker;
  private _iPosition = 0;
  private markerVmax!: L.Marker;
  private markersChutes: L.Marker[] = [];
  private dessinTracesStat: DessinTraceStat[] = [];

  @Input()
  set calculStatOk(value: boolean) {
    if (value) {
      this.dessineMarkerChutes();  
    }
  }

  private _iStat = -1;

  get iStat(): number {
    return this._iStat;
  }

  @Output()
  iStatChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  set iStat(value: number) {
    this._iStat = value;
    this.metAJourStats();
  }

  @Input()
  set visuStats(value: boolean) {
    this._visuStats = value;
    this.dessineTrace();
    this.metAJourStats();
  }

  @Input()
  set visuChutes(value: boolean) {
    this._visuChutes = value;
    this.dessineMarkerChutes();
  }

  get date(): string {
    if (this.gpxService.estOK) {
      const d = this.gpxService.pointsGps[this._iPosition].date;
      return d.toLocaleString();
    } else {
      return '';
    }
  }

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get iPosition(): number {
    return this._iPosition;
  }

  set iPosition(value: number) {
    this._iPosition = value;
    this.positionChange.emit(value);
    this.updatePosition();
  }

  private _iFenetre!: Fenetre;

  @Input()
  get iFenetre(): Fenetre {
    return this._iFenetre;
  }

  set iFenetre(value: Fenetre) {
    this._iFenetre = value;
    if (this.gpxService.estOK) {
      this.dessineTrace();
    }
  }

  private _vSeuil!: number;

  @Input()
  get vSeuil(): number {
    return this._vSeuil;
  }

  set vSeuil(value: number) {
    this._vSeuil = value;
    if (this.gpxService.estOK) {
      this.dessineTrace();
    }
  }

  private metAJourStats(): void {
    if (this.markerVmax) {
      this.markerVmax.remove();
    }
    if (this._visuStats) {
      this.dessineMarkerVmax();
    }

    if (this._iStat == -1 || !this._visuStats) {
      for (let dessin of this.dessinTracesStat) {
        dessin.ligne.remove();
        dessin.flecheA.remove();
        dessin.flecheB.remove();
      }
      this.dessinTracesStat = [];
    } else {
      for (let dessin of this.dessinTracesStat) {
        dessin.ligne.remove();
        dessin.flecheA.remove();
        dessin.flecheB.remove();
      }
      this.dessinTracesStat = [];

      if (this._iStat > -1) {
          for (let i = 9; i >= 0; i--) {
            const L = this.dessineTraceVitesse(
              this.statService.stats[this._iStat].v[i],
              couleursStat[i]
            );
            this.dessinTracesStat.push(L);
          }
        }
    }
    this.dessineTrace();
  }

  private dessineMarkerVmax(): void {
    if (this.markerVmax) {
      this.markerVmax.remove();
    }
    if (this.gpxService.estOK) {
      const ivmax = this.gpxService.ivmax;
      const coord = new L.LatLng(
        this.gpxService.pointsGps[ivmax].lat,
        this.gpxService.pointsGps[ivmax].lon
      );
      const defaultIcon = L.icon({
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      });
      this.markerVmax = L.marker(coord, { icon: defaultIcon })
        .on('click', (e: L.LeafletMouseEvent) => {
          const i = this.gpxService.calculeIndiceLePlusPresDe(
            e.latlng.lat,
            e.latlng.lng,
            0.1
          );
          if (i != -1) {
            this.iPosition = i;
          }
        })
        .bindTooltip('VMax : ' + this.gpxService.vmax.toFixed(2) + ' kts')
        .addTo(this.map);
    }
  }

  private dessineMarkerChutes(): void {
    for (let m of this.markersChutes) {
      if (m) {
        m.remove();
      }
    }
    this.markersChutes = [];
    if (this._visuChutes && this.statService.calculOK) {
      for (let c of this.statService.chutes) {
        const coord = new L.LatLng(
          this.gpxService.pointsGps[c].lat,
          this.gpxService.pointsGps[c].lon
        );
        const defaultIcon = L.icon({
          iconUrl: 'assets/marker-chute.png',
          iconSize: [25, 22],
        });
        const m = L.marker(coord, { icon: defaultIcon })
          .addTo(this.map)
          .on('click', (e: L.LeafletMouseEvent) => {
            const i = this.gpxService.calculeIndiceLePlusPresDe(
              e.latlng.lat,
              e.latlng.lng,
              0.1
            );
            if (i != -1) {
              this.iPosition = i;
            }
          });
        this.markersChutes.push(m);
      }
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [39.8282, -98.5795],
      zoom: 3,
      zoomControl: false,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.map.on('click', (e) => {
      const i = this.gpxService.calculeIndiceLePlusPresDe(
        e.latlng.lat,
        e.latlng.lng,
        0.1
      );
      if (i != -1) {
        this.iPosition = i;
      }
      this._iStat = -1;
      this.iStatChange.emit(this._iStat);
    });
  }

  constructor(
    private gpxService: GpxService,
    private statService: StatService
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.gpxService.lit().subscribe({
      next: () => {
        this.dessineTrace();

        // zoom sur zone
        let xy = [];
        const txy = this.gpxService.pointsGps;
        for (let i = 0; i < txy.length; i++) {
          let coord = new L.LatLng(txy[i].lat, txy[i].lon);
          xy.push(coord);
        }
        let polyline = L.polyline(xy, { color: 'black' });
        this.map.fitBounds(polyline.getBounds());
        
        this.metAJourStats();
      },
      error: (err) => console.log(err),
    });
  }

  private updatePosition() {
    if (this.gpxService.estOK) {
      const i = this.iPosition;
      const lat = this.gpxService.pointsGps[i].lat;
      const lon = this.gpxService.pointsGps[i].lon;
      this.markerVitesse.setLatLng({ lat: lat, lng: lon });
      this.markerVitesse.setRotationAngle(
        this.gpxService.pointsCalcules[i].angle
      );
      this.markerVitesse.setTooltipContent(
        this.gpxService.pointsCalcules[i].vitesse.toFixed(2)
      );
    }
  }

  private dessineTrace(): void {
    if (!this.gpxService.estOK) return;
    let polylignes = [];

    let txy2: L.LatLng[] = [];
    let opacite0, opacite;
    opacite0 = 1.0;
    let cat0, cat;
    cat0 = 0;
    const txy = this.gpxService.pointsGps;
    let tc = this.gpxService.pointsCalcules;
    for (let i = 0; i < txy.length; i++) {
      const coord = new L.LatLng(txy[i].lat, txy[i].lon);
      txy2.push(coord);
      if (tc[i].vitesse > this._vSeuil) {
        cat = 1;
      } else {
        cat = 0;
      }
      if (this.indiceEndehorsBornes(i)) {
        opacite = 0.1;
      } else {
        opacite = 1.0;
      }
      if (opacite0 != opacite || txy2.length >= 100) {
        polylignes.push(
          L.polyline(txy2, {
            color: this.couleurCategorie(cat0),
            opacity: opacite0,
          })
        );
        txy2 = [];
        const coord = new L.LatLng(txy[i].lat, txy[i].lon);
        txy2.push(coord);
        opacite0 = opacite;
      } else {
        if (cat0 != cat || txy2.length >= 100) {
          polylignes.push(
            L.polyline(txy2, {
              color: this.couleurCategorie(cat0),
              opacity: opacite,
            })
          );
          txy2 = [];
          const coord = new L.LatLng(txy[i].lat, txy[i].lon);
          txy2.push(coord);
          cat0 = cat;
        }
      }
      if (i == txy.length - 1) {
        polylignes.push(
          L.polyline(txy2, {
            color: this.couleurCategorie(cat0),
            opacity: opacite0,
          })
        );
      }
    }

    if (this.trace) {
      this.trace.remove();
    }
    this.trace = L.layerGroup(polylignes).addTo(this.map);

    var myIcon = L.icon({
      iconUrl: 'assets/fleche.png',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      tooltipAnchor: [26, 26],
      className: 'marker',
    });

    if (this.markerVitesse) {
      this.markerVitesse.remove();
    }
    let xy0 = new L.LatLng(txy[this._iPosition].lat, txy[this._iPosition].lon);
    this.markerVitesse = L.marker(xy0, {
      icon: myIcon,
      rotationAngle: this.gpxService.pointsCalcules[this._iPosition].angle,
    })
      .bindTooltip(
        this.gpxService.pointsCalcules[this._iPosition].vitesse.toFixed(2),
        { permanent: true }
      )
      .addTo(this.map);
    this.markerVitesse.openTooltip();
  }

  private indiceEndehorsBornes(i: number): boolean {
    if (
      i < this._iFenetre.gauche ||
      i > this._iFenetre.droite ||
      (this._iStat > -1 && this._visuStats)
    ) {
      return true;
    }
    return false;
  }

  private couleurCategorie(cat: number): string {
    if (cat == 0) {
      return 'blue';
    } else {
      return 'red';
    }
  }

  private dessineTraceVitesse(v: Vitesse, couleur: string): DessinTraceStat {
    const FA = this.dessineFleche(v.a);
    const FB = this.dessineFleche(v.b);
    let xy2: L.LatLng[] = [];
    const a = v.a;
    const b = v.b;
    const txy = this.gpxService.pointsGps;
    for (let i = a; i <= b; i++) {
      const coord = new L.LatLng(txy[i].lat, txy[i].lon);
      xy2.push(coord);
    }
    const Ligne = L.polyline(xy2, {
      color: couleur,
      opacity: 1.0,
    })
      .bindTooltip(v.v.toFixed(2))
      .addTo(this.map);
    return { ligne: Ligne, flecheA: FA, flecheB: FB };
  }

  private dessineFleche(i: number): L.Marker {
    var myIcon = L.icon({
      iconUrl: 'assets/fleche-mini.png',
      iconSize: [10, 10],
      iconAnchor: [5, 5],
      tooltipAnchor: [5, 5],
      className: 'fleche',
    });

    const txy = this.gpxService.pointsGps;
    let xy0 = new L.LatLng(txy[i].lat, txy[i].lon);
    return L.marker(xy0, {
      icon: myIcon,
      rotationAngle: this.gpxService.pointsCalcules[i].angle,
    }).addTo(this.map);
  }
}
