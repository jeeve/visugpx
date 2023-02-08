import { AfterViewInit, Component, Output, EventEmitter, Input } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-rotatedmarker';
import { GpxService } from '../gpx.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private trace!: L.LayerGroup;
  private markerVitesse!: L.Marker;

  get position(): number {
    return this.gpxService.indicePosition;
  }

  @Input()
  set position(value: number) {
    this.gpxService.indicePosition = value;
    if (value) {
      this.updatePosition();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [39.8282, -98.5795],
      zoom: 3,
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

    this.map.on("click", (e) => {
      const i = this.calculeIndiceLePlusPresDe(e.latlng.lat, e.latlng.lng);
      if (i != -1) {
        this.gpxService.indicePosition = i;
      }
    });
  }

  constructor(private gpxService: GpxService) {

  }

  ngAfterViewInit(): void {
    this.initMap();
    this.gpxService.lit().subscribe({
      next: () => this.dessineTrace(),
      error: (err) => console.log(err),
    });
  }

  private updatePosition() {
    const i = this.gpxService.indicePosition;
    const lat = this.gpxService.pointsGps[i].lat;
    const lon = this.gpxService.pointsGps[i].lon;
    this.markerVitesse.setLatLng({ lat: lat, lng: lon });
    this.markerVitesse.setRotationAngle(this.gpxService.pointsCalcules[i].angle);
    this.markerVitesse.setTooltipContent(this.gpxService.pointsCalcules[i].vitesse.toString());
  }

  private dessineTrace(): void {
    let polylignes = [];

    var seuil = 12.0;

    let txy2: L.LatLng[] = [];
    let opacite0, opacite;
    opacite0 = 1.0;
    let cat0, cat;
    cat0 = 0;
    const txy = this.gpxService.pointsGps;
    let tc = this.gpxService.pointsCalcules;
    for (let i = 0; i < txy.length; i++) {
      let coord = new L.LatLng(txy[i].lat, txy[i].lon);
      txy2.push(coord);
      if (tc[i].vitesse > seuil) {
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
        let coord = new L.LatLng(txy[i].lat, txy[i].lon);
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
          let coord = new L.LatLng(txy[i].lat, txy[i].lon);
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
    let xy0 = new L.LatLng(txy[0].lat, txy[0].lon);
    this.markerVitesse = L.marker(xy0, { icon: myIcon, rotationAngle: 0.0 })
      .bindTooltip('0', { permanent: true })
      .addTo(this.map);
    this.markerVitesse.openTooltip();

    let xy = [];
    for (let i = 0; i < txy.length; i++) {
      let coord = new L.LatLng(txy[i].lat, txy[i].lon);
      xy.push(coord);
    }
    let polyline = L.polyline(xy, { color: 'black' });
    this.map.fitBounds(polyline.getBounds());
  }

  private indiceEndehorsBornes(i: number): boolean {
    if (
      i < this.gpxService.indiceFenetreMin ||
      i > this.gpxService.indiceFenetreMax
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
  }

}
