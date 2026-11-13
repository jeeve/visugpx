import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
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
const LARGEUR_LIGNE_SOURIS = 10;
const LARGEUR_LIGNE_TACTILE = 34;
declare let google: any;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements AfterViewInit {
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

  // zone de saisie des lignes : plus large sur écran tactile (doigt)
  readonly largeurLigne =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches
      ? LARGEUR_LIGNE_TACTILE
      : LARGEUR_LIGNE_SOURIS;

  @Input()
  get chutes(): number[] {
    return this.statService.chutes;
  }

  private _visuStats = true;

  // sur mobile le graphe est réduit quand les stats sont affichées (CSS) :
  // on le redessine une fois la nouvelle hauteur appliquée
  @Input()
  get visuStats(): boolean {
    return this._visuStats;
  }

  set visuStats(value: boolean) {
    const change = value !== this._visuStats;
    this._visuStats = value;
    if (change) {
      setTimeout(() => this.resize());
    }
  }

  // hauteur des lignes verticales : celle du graphe moins l'axe des x
  get hauteurLignes(): number {
    const c = this.chartElement();
    return c && c.clientHeight > 20 ? c.clientHeight - 20 : 135;
  }

  @Input()
  iStat = -1;

  get ivmax(): number {
    return this.statService.ivmax;
  }

  get vitesses(): Vitesse[] {
    if (this.iStat > -1) {
      return this.statService.stats[this.iStat].v;
    } else {
      return [];
    }
  }

  get couleursStat(): string[] {
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

  private x(i: number): number {
    if (this.modeTemps) {
      return this.gpxService.pointsCalcules[i].temps;
    } else {
      return this.gpxService.pointsCalcules[i].distance;
    }
  }

  get XFenetreGauche(): number {
    if (this.chart && this.gpxService.estOK) {
      if (this.fenetre.a <= this.fenetre.b) {
        return this.xLoc(this.x(this.fenetre.a)) - this.largeurLigne / 2;
      } else {
        return this.xLoc(this.x(this.fenetre.b)) - this.largeurLigne / 2;
      }
    } else {
      return 25;
    }
  }

  get XFenetreDroite(): number {
    if (this.chart && this.gpxService.estOK) {
      if (this.fenetre.a <= this.fenetre.b) {
        return this.xLoc(this.x(this.fenetre.b)) - this.largeurLigne / 2;
      } else {
        return this.xLoc(this.x(this.fenetre.a)) - this.largeurLigne / 2;
      }
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

  ngAfterViewInit(): void {
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
      this.drawChart() //this.chart.draw(this.data, this.options); ne marche pas !!
    }
  }

  private timeFormat(t: number): string {
    const heures = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = t % 60;
    let sheures = heures.toString();
    let sminutes = minutes.toString();
    let sseconds = seconds.toString();
    sheures = heures < 10 ? '0' + sheures : sheures;
    sminutes = minutes < 10 ? '0' + sminutes : sminutes;
    sseconds = seconds < 10 ? '0' + sseconds : sseconds;
    return sheures + ':' + sminutes;
  }

  private drawChart(): void {
    let abscisse: number;

    this.data = new google.visualization.DataTable();
    this.data.addColumn('number', 'Distance');
    this.data.addColumn('number', 'Vitesse');

    for (let i = 0; i < this.gpxService.pointsCalcules.length; i++) {
      if (this.modeTemps) {
        abscisse = this.gpxService.pointsCalcules[i].temps;
      } else {
        abscisse = this.gpxService.pointsCalcules[i].distance;
      }
      this.data.addRow([abscisse, this.gpxService.pointsCalcules[i].vitesse]);
    }

    let hAxis = {}
    
    if (this.modeTemps) {
      const range = this.data.getColumnRange(0);
      const max = Math.ceil(range.max / 100) * 100;
      var ticks = [];
      for (let i = 600; i < max-600; i = i + 600) {
        ticks.push({
          v: i,
          f: this.timeFormat(i),
        });
      }
      hAxis = {
        ticks: ticks,
        slantedText: false,
      }
    }

    const vAxis: any = {
      viewWindowMode: 'explicit',
      viewWindow: { min: 0, max: this.gpxService.vmax },
    };
    // graphe réduit : graduations rondes, sinon Google tronque les libellés
    const c = this.chartElement();
    if (c && c.clientHeight < 120) {
      vAxis.ticks = [];
      for (let v = 0; v <= this.gpxService.vmax; v += 10) {
        vAxis.ticks.push(v);
      }
    }

    this.options = {
      fontSize: 12,
      hAxis: hAxis,
      vAxis: vAxis,
      pointSize: 0,
      legend: { position: 'none' },
      chartArea: { left: '30', right: '0', top: '10', bottom: '20' },
      enableInteractivity: false,
      dataOpacity: 0.0,
      lineWidth: 1,
    };

    this.chart = new google.visualization.AreaChart(this.chartElement());

    this.chart.draw(this.data, this.options);
  }

  private elementSelectionne: HTMLElement | null = null;

  clickChart(e: Event): void {
    e.preventDefault();
    const x = this.chartGetx((e as MouseEvent).clientX);
    if (x >= 0 && x <= this.xmax()) {
      this.iPosition = this.getIndiceAbscisse(x);
    }
  }

  private getIndiceAbscisse(x: number): number {
    if (this.modeTemps) {
      const d = new Date(this.gpxService.pointsGps[0].date);
      d.setTime(d.getTime() + x * 1000);
      return this.gpxService.getIndiceTemps(d);
    } else {
      return this.gpxService.getIndiceDistance(x);
    }
  }

  mouseDown(e: Event): void {
    const pe = e as PointerEvent;
    const cible = pe.target as Element;
    this.elementSelectionne = cible.closest('.ligne') as HTMLElement | null;
    if (this.elementSelectionne?.classList.contains('ligne-verticale')) {
      this.elementSelectionne = this.ligneVerticaleLaPlusProche(
        this.elementSelectionne,
        pe.clientX
      );
    }
    if (this.elementSelectionne) {
      // évite le défilement / zoom de la page pendant le glissé au doigt
      pe.preventDefault();
      // le glissé continue même si le doigt (ou la souris) sort de la ligne
      try {
        cible.setPointerCapture(pe.pointerId);
      } catch {}
    }
  }

  // Les zones de saisie des lignes verticales se chevauchent (la fenêtre
  // entoure la position de près) : on prend la ligne dont le trait est le
  // plus proche du doigt, la ligne de position gagnant en cas d'égalité.
  private ligneVerticaleLaPlusProche(
    touchee: HTMLElement,
    clientX: number
  ): HTMLElement {
    const conteneur = touchee.closest('#controle-container');
    if (!conteneur) {
      return touchee;
    }
    const lignes = Array.from(
      conteneur.querySelectorAll<HTMLElement>('.ligne-verticale')
    ).sort(
      (a, b) =>
        Number(b.classList.contains('ligne-position')) -
        Number(a.classList.contains('ligne-position'))
    );
    let meilleure = touchee;
    let dMin = Infinity;
    for (const l of lignes) {
      const r = l.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - clientX);
      if (d < dMin) {
        dMin = d;
        meilleure = l;
      }
    }
    return meilleure;
  }

  // bloque le défilement natif dès que le doigt touche une ligne,
  // sinon le navigateur annule le glissé (pointercancel)
  toucheLigne(e: Event): void {
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  mouseMove(e: Event): void {
    if (this.elementSelectionne) {
      if (this.elementSelectionne.classList.contains('ligne-verticale')) {
        const x = this.chartGetx((e as MouseEvent).clientX);
        if (x >= 0 && x <= this.xmax()) {
          if (this.elementSelectionne.classList.contains('ligne-position')) {
            this.iPosition = this.getIndiceAbscisse(x);
          }
          if (this.elementSelectionne.classList.contains('ligne-gauche')) {
            this.fenetre.auto = false;
            this.fenetre.a = this.getIndiceAbscisse(x);
            this.fenetreChange.emit(this.fenetre);
          }
          if (this.elementSelectionne.classList.contains('ligne-droite')) {
            this.fenetre.auto = false;
            this.fenetre.b = this.getIndiceAbscisse(x);
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

  private xmax(): number {
    return this.data.getValue(this.data.getNumberOfRows() - 1, 0);
  }

  private chartGetx(X: number): number {
    const layout = this.chart.getChartLayoutInterface();
    const L = layout.getChartAreaBoundingBox().width;
    const c = this.chartElement();
    if (c) {
      const X2 = X - c.clientLeft - 40;
      return (X2 * this.xmax()) / L;
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
      return this.xLoc(this.x(this._iPosition)) - this.largeurLigne / 2;
    } else {
      return 0;
    }
  }

  get YSeuil(): number {
    if (this.chart && this.gpxService.estOK) {
      return this.yLoc(this._vSeuil) - this.largeurLigne / 2 + 10;
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
      return this.xLoc(this.x(i)) - 5;
    } else {
      return 25;
    }
  }
}
