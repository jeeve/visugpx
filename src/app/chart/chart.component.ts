import { Component, OnInit } from '@angular/core';
import { GpxService } from '../gpx.service';

declare var google: any;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {

  private chartxy!: Array<any>;

  constructor(private gpxService: GpxService) {
  }

  ngOnInit(): void {
    this.gpxService.lit("https://greduvent.000webhostapp.com/sensations/gpx/2023_01_07_jablines.gpx").subscribe({
      next: () => { 
        google.load("visualization", "1.0", { packages: ["corechart"] });
        google.setOnLoadCallback(this.draw);
      },
      error: (err) => console.log(err)
    });
  }

  private draw() {

    this.chartxy = [];
    this.chartxy.push(["Distance", "Vitesse"]);
    for (let i=0 ; i < this.gpxService.pointsCalcules.length; i++) {
      this.chartxy.push([this.gpxService.pointsCalcules[i].distance, this.gpxService.pointsCalcules[i].vitesse]);
    }

    if (this.chartxy.length == 0) {
      return;
    }
    var data = google.visualization.arrayToDataTable(this.chartxy);

    var vAxisOptions;
    var enableInteractivityOptions = false;

    vAxisOptions = {
      viewWindowMode: "explicit",
      viewWindow: { min: 0, max: this.gpxService.vmax },
    };

    var options = {
      vAxis: vAxisOptions,
      pointSize: 0,
      legend: { position: "none" },
      chartArea: { left: "30", right: "0", top: "10", bottom: "20" },
      enableInteractivity: enableInteractivityOptions,
      dataOpacity: 0.0,
    };

    let chart = new google.visualization.LineChart(document.querySelector("#chart"));
  
    chart.draw(data, options);
   }

}
