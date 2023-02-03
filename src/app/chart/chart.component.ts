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
        .lit(
          'https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx'
        )
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

    var vAxisOptions;
    var enableInteractivityOptions = false;

    vAxisOptions = {
      viewWindowMode: 'explicit',
      viewWindow: { min: 0, max: this.gpxService.vmax },
    };

    var options = {
      vAxis: vAxisOptions,
      pointSize: 0,
      legend: { position: 'none' },
      chartArea: { left: '30', right: '0', top: '10', bottom: '20' },
      enableInteractivity: enableInteractivityOptions,
      dataOpacity: 0.0,
    };

    let chart = new google.visualization.LineChart(
      document.querySelector('#chart')
    );

    chart.draw(data, options);
  }
}
