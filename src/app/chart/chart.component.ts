import { Component, OnInit } from '@angular/core';
import { GpxService } from '../gpx.service';

declare var google: any;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    this.gpxService.lit("https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx").subscribe({
      next: () => { 
        //google.load("visualization", "1.0", { packages: ["corechart"] });
        //google.setOnLoadCallback(drawChart(this.gpxService));
        google.charts.load('current', { packages: ['corechart'] }).then(drawChart(this.gpxService));
      },
      error: (err) => console.log(err)
    });
  }

}
  
function drawChart(gpxService: GpxService) {

    let chartxy = [];
    chartxy.push(["Distance", "Vitesse"]);
    for (let i=0 ; i < gpxService.pointsCalcules.length; i++) {
      chartxy.push([gpxService.pointsCalcules[i].distance, gpxService.pointsCalcules[i].vitesse]);
    }

    if (chartxy.length == 0) {
      return;
    }

    var vAxisOptions;
    var enableInteractivityOptions = false;

    vAxisOptions = {
      viewWindowMode: "explicit",
      viewWindow: { min: 0, max: gpxService.vmax },
    };

    var options = {
      vAxis: vAxisOptions,
      pointSize: 0,
      legend: { position: "none" },
      chartArea: { left: "30", right: "0", top: "10", bottom: "20" },
      enableInteractivity: enableInteractivityOptions,
      dataOpacity: 0.0,
    };

    let data = google.visualization.arrayToDataTable(chartxy);

    let chart = new google.visualization.LineChart(document.querySelector("#chart"));
  
    chart.draw(data, options);
   }

