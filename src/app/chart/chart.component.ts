import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { GpxService, Vitesse } from '../gpx.service';
import { Fenetre } from '../app.component';
import { ScriptService } from '../script.service';
import { StatService } from '../stat.service';
import { couleursStat } from '../stat/stat.component';

const SCRIPT_PATH = 'https://www.google.com/jsapi';
const LARGEUR_LIGNE = 10;
declare let google: any;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  affichageOK = false;

  @Input()
  modeTemps = false;
  
  @ViewChild('charttemplate') 
  chartTemplate!: ElementRef;

  private chartElement(): HTMLElement | null {
    if (this.chartTemplate) {
      return this.chartTemplate.nativeElement;
    }
    return null;
  }
 
  private _vSeuil = 0;

  @Input()
  get chutes(): number[] {
    return this.statService.chutes;
  }

  @Input()
  visuStats = true;

  @Input()
  iStat = -1;

  get ivmax(): number {
    return this.statService.ivmax;
  }

  get vitesses() : Vitesse[] {
    if (this.iStat > -1) {
      return this.statService.stats[this.iStat].v;
    } else {
      return [];
    }
  }

  get couleursStat() : string[] {
    return couleursStat;
  }

  @Input()
  visuChutes = true;

  @Input()
  afficheFenetre = true;

  @Input()
  fenetre!: Fenetre;

  @Output()
  fenetreChange: EventEmitter<Fenetre> = new EventEmitter<Fenetre>();

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
    this.majFenetre();
    this.positionChange.emit(value);
    this.fenetreChange.emit(this.fenetre);
  }

  private majFenetre() {
    if (this.fenetre) {
      this.fenetre.calcule(this._iPosition);
    }
  }

  get XFenetreGauche(): number {
    if (this.chart && this.gpxService.estOK) {
      if (this.fenetre.a <= this.fenetre.b) {
        return (
          this.xLoc(this.gpxService.x(this.fenetre.a)) -
          LARGEUR_LIGNE / 2
        );
      } else {
        return (
          this.xLoc(this.gpxService.x(this.fenetre.b)) -
          LARGEUR_LIGNE / 2
        );
      }
    } else {
      return 25;
    }
  }

  get XFenetreDroite(): number {
    if (this.chart && this.gpxService.estOK) {
      if (this.fenetre.a <= this.fenetre.b) {
        return (
          this.xLoc(this.gpxService.x(this.fenetre.b)) -
          LARGEUR_LIGNE / 2
        );
      } else {
        return (
          this.xLoc(this.gpxService.x(this.fenetre.a)) -
          LARGEUR_LIGNE / 2
        );
      }
    } else {
      return 0;
    }
  }

  get largeur(): number {
    const c = this.chartElement();
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
    private gpxService: GpxService,
    private statService: StatService
  ) {}

  ngOnInit(): void {
    const scriptElement = this.scriptService.loadJsScript(
      this.renderer,
      SCRIPT_PATH
    );

    scriptElement.onload = () => {
      this.gpxService.lit().subscribe(() => {
        google.charts.load('current', { packages: ['corechart'] });
        google.charts.setOnLoadCallback(this.initChart.bind(this));
        this.affichageOK = true;
      });
    };
  }

  private initChart() {
    this.drawChart();
    this.fenetre.largeur = 2;
    this.majFenetre();
  }

  resize(): void {
    if (this.chart && this.data && this.options) {
      this.chart.draw(this.data, this.options);
    }
  }

  private drawChart(): void {
    let chartxy = [];
    let abscisse: number;
    chartxy.push(['Distance', 'Vitesse']);
    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      if (this.modeTemps) {
        abscisse = this.gpxService.pointsCalcules[i].temps;
      } else {
        abscisse = this.gpxService.pointsCalcules[i].distance;
      } 
      chartxy.push([
        abscisse,
        this.gpxService.pointsCalcules[i].vitesse,
      ]);
    }

    if (chartxy.length == 0) {
      return;
    }

    this.data = google.visualization.arrayToDataTable(chartxy);

    const vAxisOptions = {
      viewWindowMode: 'explicit',
      viewWindow: { min: 0, max: this.gpxService.vmax },
    };

    this.options = {
      vAxis: vAxisOptions,
      pointSize: 0,
      legend: { position: 'none' },
      chartArea: { left: '30', right: '0', top: '10', bottom: '20' },
      enableInteractivity: false,
      dataOpacity: 0.0,
      lineWidth: 1,
    };

    this.chart = new google.visualization.LineChart(
      this.chartElement()
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
            this.fenetre.auto = false;
            this.fenetre.a = this.gpxService.getIndiceDistance(x);
            this.fenetreChange.emit(this.fenetre);
          }
          if (this.elementSelectionne.classList.contains('ligne-droite')) {
            this.fenetre.auto = false;
            this.fenetre.b = this.gpxService.getIndiceDistance(x);
            this.fenetreChange.emit(this.fenetre);
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
    const c = this.chartElement();
    if (c) {
      const X2 = X - c.clientLeft - 40;
      return (X2 * this.gpxService.dmax) / L;
    }
    return -1;
  }

  private chartGety(Y: number): number {
    const layout = this.chart.getChartLayoutInterface();
    const H = layout.getChartAreaBoundingBox().height;
    const c = this.chartElement();
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

  X(i: number): number {
    if (this.chart && this.gpxService.estOK) {
      return this.xLoc(this.gpxService.x(i)) - 5;
    } else {
      return 25;
    }
  }
}
