import { Component, OnInit, Renderer2 } from '@angular/core';
import { from, mergeMap } from 'rxjs';
import { GpxService } from '../gpx.service';
import { ScriptService } from '../script.service';

const SCRIPT_PATH = 'https://www.google.com/jsapi';
declare let google: any;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  constructor(
    private renderer: Renderer2,
    private scriptService: ScriptService,
    private gpxService: GpxService
  ) {}

  private chart: any;

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

      this.gpxService
        .lit()
        .pipe(mergeMap(() => observable));
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
    var data = google.visualization.arrayToDataTable(chartxy);

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
  }

  private createLineVerticaleSVG(x: number, classeName: string, pointille: boolean) {
    const LARGEUR_LIGNE = 10;
    const layout = this.chart.getChartLayoutInterface();
    const chartArea = layout.getChartAreaBoundingBox();
    const svg = this.chart.getContainer().getElementsByTagName("svg")[0];
    const xLoc = layout.getXLocation(x) - LARGEUR_LIGNE / 2;
    const y1 = chartArea.top;
    const y2 = chartArea.height + chartArea.top;

    var svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg2.setAttribute("class", "ligne " + classeName);
    svg2.setAttribute("x", xLoc.toString());
    svg2.setAttribute("y", y1);
    svg2.setAttribute("width", LARGEUR_LIGNE.toString());
    svg2.setAttribute("height", (y2 - y1).toString());
    svg.appendChild(svg2);

    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("stroke", "#FF0000");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("fill-opacity", "0");
    rect.setAttribute("stroke-opacity", "0");
    svg2.appendChild(rect);

    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", (LARGEUR_LIGNE / 2).toString());
    line.setAttribute("y1", "0");
    line.setAttribute("x2", (LARGEUR_LIGNE / 2).toString());
    line.setAttribute("y2", (y2 - y1).toString());
    line.setAttribute("stroke", "#000000");
    line.setAttribute("stroke-width", "3");
    if (pointille) {
      line.setAttribute("stroke-dasharray", "5, 5");
    }
    svg2.appendChild(line);
  }

}
