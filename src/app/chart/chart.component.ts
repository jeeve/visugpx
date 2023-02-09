import {
  Component,
  Input,
  OnInit,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { from, mergeMap } from 'rxjs';
import { GpxService } from '../gpx.service';
import { ScriptService } from '../script.service';

const SCRIPT_PATH = 'https://www.google.com/jsapi';
const LARGEUR_LIGNE = 10;
declare let google: any;

type ElementGraphique = { position: number; element: Element | null };

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  constructor(
    private renderer: Renderer2,
    private scriptService: ScriptService,
    private gpxService: GpxService
  ) {}

  get position(): number {
    return this.gpxService.indicePosition;
  }

  @Input()
  set position(value: number) {
    this.gpxService.indicePosition = value;
    this.updatePosition();
  }

  private chart: any;

  private xLoc(d: number): number {
    const layout = this.chart.getChartLayoutInterface();
    const chartArea = layout.getChartAreaBoundingBox();
    const svg = this.chart.getContainer().getElementsByTagName('svg')[0];
    return layout.getXLocation(d);
  }

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

  private drawChart() {
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
    const data = google.visualization.arrayToDataTable(chartxy);

    const enableInteractivityOptions = false;

    const vAxisOptions = {
      viewWindowMode: 'explicit',
      viewWindow: { min: 0, max: this.gpxService.vmax },
    };

    const options = {
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

    this.chart.draw(data, options);

    const c = document.querySelector('#chart');
    if (c) {
      c.addEventListener('click', (e) => {
        e.preventDefault();
        const x = this.chartGetx((e as MouseEvent).clientX);
        if (x >= 0 && x <= this.gpxService.dmax) {
          this.position = this.gpxService.getIndiceDistance(x);
        }
      });
    }

    this.createLineVerticaleSVG(this.gpxService.x(), 'ligne-position', true);
    this.registerEvtLignePositionSVG();
  }

  private createLineVerticaleSVG(
    x: number,
    classeName: string,
    pointille: boolean
  ) {
    const layout = this.chart.getChartLayoutInterface();
    const chartArea = layout.getChartAreaBoundingBox();
    const svg = this.chart.getContainer().getElementsByTagName('svg')[0];
    const xLoc = this.xLoc(x - LARGEUR_LIGNE / 2);
    const y1 = chartArea.top;
    const y2 = chartArea.height + chartArea.top;

    var svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg2.setAttribute('class', 'ligne ' + classeName);
    svg2.setAttribute('x', xLoc.toString());
    svg2.setAttribute('y', y1);
    svg2.setAttribute('width', LARGEUR_LIGNE.toString());
    svg2.setAttribute('height', (y2 - y1).toString());
    svg.appendChild(svg2);

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('stroke', '#FF0000');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('fill-opacity', '0');
    rect.setAttribute('stroke-opacity', '0');
    svg2.appendChild(rect);

    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (LARGEUR_LIGNE / 2).toString());
    line.setAttribute('y1', '0');
    line.setAttribute('x2', (LARGEUR_LIGNE / 2).toString());
    line.setAttribute('y2', (y2 - y1).toString());
    line.setAttribute('stroke', '#000000');
    line.setAttribute('stroke-width', '3');
    if (pointille) {
      line.setAttribute('stroke-dasharray', '5, 5');
    }
    svg2.appendChild(line);
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

  private updatePosition() {
    const ligne = document.querySelector('.ligne-position');
    if (ligne) {
      ligne.setAttribute(
        'x',
        (this.xLoc(this.gpxService.x()) - LARGEUR_LIGNE / 2).toString()
      );
    }
  }

  private curseurPosition: ElementGraphique = { position: -1, element: null };

  private registerEvtLignePositionSVG() {
    const ligne = document.querySelector('.ligne-position');
    if (ligne) {
      ligne.addEventListener('mousedown', (e) => {
        e.stopPropagation()
        this.curseurPosition.element = e.target as Element;
      });
      ligne.addEventListener('mousemove', (e) => {
        e.stopPropagation()
        if (this.curseurPosition.element) {
          const x = this.chartGetx((e as MouseEvent).clientX);
          if (x >= 0 && x <= this.gpxService.dmax) {
            this.position = this.gpxService.getIndiceDistance(x);
          }
        }
      });
      ligne.addEventListener('mouseup', (e) => {
        e.stopPropagation()
        this.curseurPosition.element = null;
      });
      ligne.addEventListener('click', (e) => e.stopPropagation());
    }
  }
}
