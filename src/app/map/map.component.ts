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
import { couleursStat, Stat } from '../stat/stat.component';

type DessinTraceStat =  { ligne: L.Polyline, flecheA: L.Marker, flecheB: L.Marker };

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit {
  private _visuStats = false;
  private map!: L.Map;
  private trace!: L.LayerGroup;
  private markerVitesse!: L.Marker;
  private _iPosition = 0;
  private markerVmax!: L.Marker;
  private dessinTracesStat: DessinTraceStat[]  = [];

  _stat: Stat | null = null;

  get stat(): Stat | null {
    return this._stat;
  }

  @Output()
  statChange: EventEmitter<Stat | null> = new EventEmitter<Stat | null>();

  @Input()
  set stat(value: Stat | null) {
    this._stat = value;
    this.statChange.emit(value);
    this.metAJourStats();
  }

  get visuStats(): boolean {
    return this._visuStats;
  }

  @Input()
  set visuStats(value: boolean) {
    this._visuStats = value;
    this.metAJourStats();
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
    if (this._stat == null || !this._visuStats) {
      if (this.markerVmax) {
        this.markerVmax.remove();
      }
      for (let dessin of this.dessinTracesStat) {
        dessin.ligne.remove();
        dessin.flecheA.remove();
        dessin.flecheB.remove();
      }
      this.dessinTracesStat = [];
    } else {
      if (this.markerVmax) {
        this.markerVmax.remove();
      }
      for (let dessin of this.dessinTracesStat) {
        dessin.ligne.remove();
        dessin.flecheA.remove();
        dessin.flecheB.remove();
      }
      this.dessinTracesStat = [];
    
    if (this._stat) {
      this.dessineMarkerVmax();
      if (this._stat) {
        for (let i = 0; i < 10; i++) {
          const L = this.dessineTraceVitesse(this._stat.v[i], couleursStat[i]);
          this.dessinTracesStat.push(L);
        }
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
        .bindTooltip('VMax : ' + this.gpxService.vmax.toFixed(2) + ' kts')
        .addTo(this.map);
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
      const i = this.calculeIndiceLePlusPresDe(e.latlng.lat, e.latlng.lng);
      if (i != -1) {
        this.iPosition = i;
      }
      this.stat = null;
    });
  }

  constructor(private gpxService: GpxService) {}

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
    if (i < this._iFenetre.gauche || i > this._iFenetre.droite || (this.stat != null)) {
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

  private calculeIndiceLePlusPresDe = (lat: number, lng: number): number => {
    let dmin = 1000000.0;
    let d;
    let j = 0;
    let txy = this.gpxService.pointsGps;
    for (let i = 0; i < txy.length; i++) {
      d = this.gpxService.calculeDistance(lat, lng, txy[i].lat, txy[i].lon);
      if (d < dmin) {
        j = i;
        dmin = d;
      }
    }
    if (dmin < 0.1) {
      // ne prend que si moins de 100m
      return j;
    } else {
      return -1;
    }
  };

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
      opacity: 1.0
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
      className: 'fleche'
    });

    const txy = this.gpxService.pointsGps;
    let xy0 = new L.LatLng(txy[i].lat, txy[i].lon);
    return L.marker(xy0, {
      icon: myIcon,
      rotationAngle: this.gpxService.pointsCalcules[i].angle,
    }).addTo(this.map);
  }
}
