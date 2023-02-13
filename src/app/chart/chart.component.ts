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
import { ScriptService } from '../script.service';

const SCRIPT_PATH = 'https://www.google.com/jsapi';
const LARGEUR_LIGNE = 10;
declare let google: any;

type ElementGraphique = { element: Element | null };

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  
  private _position = 0;

  @Output()
  positionChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  get position() : number {
    return this._position;
  }

  set position(value: number) {
    this._position = value;
    this.positionChange.emit(value);
  }

  constructor(
    private renderer: Renderer2,
    private scriptService: ScriptService,
    private gpxService: GpxService
  ) {}

  get x(): number {
    if (this.chart && this.gpxService.estOK) {
      return this.xLoc(this.gpxService.x(this._position)) - LARGEUR_LIGNE / 2;
    } else {
      return 25;
    }
  }

  private chart: any = null;
  private data: any = null;
  private options: any = null;

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

  private curseurPosition: ElementGraphique = { element: null };

  clickChart(e: Event): void {
    e.preventDefault();
    const x = this.chartGetx((e as MouseEvent).clientX);
    if (x >= 0 && x <= this.gpxService.dmax) {
      this.position = this.gpxService.getIndiceDistance(x);
    }
  }

  mouseDown(e: Event): void {
    this.curseurPosition.element = e.target as Element;
  }

  mouseMove(e: Event): void {
    if (this.curseurPosition.element) {
      const x = this.chartGetx((e as MouseEvent).clientX);
      if (x >= 0 && x <= this.gpxService.dmax) {
        this.position = this.gpxService.getIndiceDistance(x);
      }
    }
  }

  mouseUp(e: Event): void {
    this.curseurPosition.element = null;
  }

  private xLoc(d: number): number {
    const layout = this.chart.getChartLayoutInterface();
    return layout.getXLocation(d);
  }
}
