import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { from, mergeMap } from 'rxjs';
import { GpxService } from '../gpx.service';
import { Fenetre } from '../app.component';
import { ScriptService } from '../script.service';

const SCRIPT_PATH = 'https://www.google.com/jsapi';
const LARGEUR_LIGNE = 10;
declare let google: any;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  private _vSeuil = 0;

  @Output()
  seuilChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get vSeuil(): number {
    return this._vSeuil;
  }

  set vSeuil(value: number) {
    this._vSeuil = value;
    this.seuilChange.emit(value);
  }

  private _iPosition = 0;

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get iPosition(): number {
    return this._iPosition;
  }

  set iPosition(value: number) {
    this._iPosition = value;
    this.positionChange.emit(value);
  }

  private _iFenetre = { gauche: 0, droite: 0 };

  @Output()
  fenetreChange: EventEmitter<Fenetre> = new EventEmitter<Fenetre>();

  @Input()
  get iFenetre(): Fenetre {
    return this._iFenetre;
  }

  set iFenetre(value: Fenetre) {
    this._iFenetre = value;
    this.fenetreChange.emit(value);
  }

  get XFenetreGauche(): number {
    if (this.chart && this.gpxService.estOK) {
      if (this._iFenetre.gauche <= this._iFenetre.droite) {
        return (
          this.xLoc(this.gpxService.x(this._iFenetre.gauche)) - LARGEUR_LIGNE / 2
        );
      } else {
        return (
          this.xLoc(this.gpxService.x(this._iFenetre.droite)) - LARGEUR_LIGNE / 2
        );
      }
    } else {
      return 25;
    }
  }

  get XFenetreDroite(): number {
    if (this.chart && this.gpxService.estOK) {
      if (this._iFenetre.gauche <= this._iFenetre.droite) {
        return (
          this.xLoc(this.gpxService.x(this._iFenetre.droite)) - LARGEUR_LIGNE / 2
        );
      } else {
        return (
          this.xLoc(this.gpxService.x(this._iFenetre.gauche)) - LARGEUR_LIGNE / 2
        );
      }
    } else {
      return 0;
    }
  }

  get largeur(): number {
    const c = document.querySelector('#chart');
    if (c) {
      return c.clientWidth;
    } else {
      return 0;
    }
  }

  private chart: any = null;
  private data: any = null;
  private options: any = null;

  constructor(
    private renderer: Renderer2,
    private scriptService: ScriptService,
    private gpxService: GpxService
  ) {}

  ngOnInit(): void {
    const scriptElement = this.scriptService.loadJsScript(
      this.renderer,
      SCRIPT_PATH
    );

    scriptElement.onload = () => {
      const observable = from(
        google.charts.load('current', { packages: ['corechart'] })
      );
      observable.subscribe(() => this.drawChart());

      this.gpxService.lit().pipe(mergeMap(() => observable));
    };

  //  this.gpxService.lit().subscribe(() => { this.iFenetre = { gauche: 0, droite: 0.1*(this.gpxService.pointsCalcules.length-1) }; });
  }

  resize(): void {
    if (this.chart && this.data && this.options) {
      this.chart.draw(this.data, this.options);
    }
  }

  private drawChart(): void {
    let chartxy = [];
    chartxy.push(['Distance', 'Vitesse']);
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      chartxy.push([
        this.gpxService.pointsCalcules[i].distance,
        this.gpxService.pointsCalcules[i].vitesse,
      ]);
    }

    if (chartxy.length == 0) {
      return;
    }
    this.data = google.visualization.arrayToDataTable(chartxy);

    const enableInteractivityOptions = false;

    const vAxisOptions = {
      viewWindowMode: 'explicit',
      viewWindow: { min: 0, max: this.gpxService.vmax },
    };

    this.options = {
      vAxis: vAxisOptions,
      pointSize: 0,
      legend: { position: 'none' },
      chartArea: { left: '30', right: '0', top: '10', bottom: '20' },
      enableInteractivity: enableInteractivityOptions,
      dataOpacity: 0.0,
    };

    this.chart = new google.visualization.LineChart(
      document.querySelector('#chart')
    );

    this.chart.draw(this.data, this.options);
    
  }

  private elementSelectionne: HTMLElement | null = null;

  clickChart(e: Event): void {
    e.preventDefault();
    const x = this.chartGetx((e as MouseEvent).clientX);
    if (x >= 0 && x <= this.gpxService.dmax) {
      this.iPosition = this.gpxService.getIndiceDistance(x);
    }
  }

  mouseDown(e: Event): void {
    this.elementSelectionne = (e.target as Element).parentElement;
  }

  mouseMove(e: Event): void {
    if (this.elementSelectionne) {
      if (this.elementSelectionne.classList.contains('ligne-verticale')) {
        const x = this.chartGetx((e as MouseEvent).clientX);
        if (x >= 0 && x <= this.gpxService.dmax) {
          if (this.elementSelectionne.classList.contains('ligne-position')) {
            this.iPosition = this.gpxService.getIndiceDistance(x);
          }
          if (this.elementSelectionne.classList.contains('ligne-gauche')) {
            this.iFenetre = { gauche: this.gpxService.getIndiceDistance(x), droite: this._iFenetre.droite };
          }
          if (this.elementSelectionne.classList.contains('ligne-droite')) {
            this.iFenetre = { gauche: this._iFenetre.gauche, droite: this.gpxService.getIndiceDistance(x) };
          }
        }
      } else {
        if (this.elementSelectionne.classList.contains('ligne-horizontale')) {
          const y = this.chartGety((e as MouseEvent).clientY);
          if (y >= 0 && y <= this.gpxService.vmax) {
            if (this.elementSelectionne.classList.contains('ligne-seuil'))
              this.vSeuil = y;
          }
        }
      }
    }
  }

  mouseUp(e: Event): void {
    this.elementSelectionne = null;
  }

  ligneClick(e: Event): void {
    e.stopPropagation();
  }

  mouseLeave(): void {
    this.elementSelectionne = null;
  }

  private chartGetx(X: number): number {
    const layout = this.chart.getChartLayoutInterface();
    const L = layout.getChartAreaBoundingBox().width;
    const c = document.querySelector('#chart');
    if (c) {
      const X2 = X - c.clientLeft - 40;
      return (X2 * this.gpxService.dmax) / L;
    }
    return -1;
  }

  private chartGety(Y: number): number {
    const layout = this.chart.getChartLayoutInterface();
    const H = layout.getChartAreaBoundingBox().height;
    const c = document.querySelector('#chart') as HTMLElement;
    if (c) {
      const Y2 = c.getBoundingClientRect().top + H - Y + 10;
      return (Y2 * this.gpxService.vmax) / H;
    }
    return -1;
  }

  get XPosition(): number {
    if (this.chart && this.gpxService.estOK) {
      return this.xLoc(this.gpxService.x(this._iPosition)) - LARGEUR_LIGNE / 2;
    } else {
      return 0;
    }
  }

  get YSeuil(): number {
    if (this.chart && this.gpxService.estOK) {
      return this.yLoc(this._vSeuil) - LARGEUR_LIGNE / 2 + 10;
    } else {
      return 0;
    }
  }

  private xLoc(d: number): number {
    const layout = this.chart.getChartLayoutInterface();
    return layout.getXLocation(d);
  }

  private yLoc(d: number): number {
    const layout = this.chart.getChartLayoutInterface();
    return layout.getYLocation(d);
  }
}
