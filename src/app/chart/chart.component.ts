import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { getRelativePosition } from 'chart.js/helpers';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    const chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: [1, 2, 3, 4, 5],
        datasets: [
          {
            label: 'Acquisitions by year',
            data: [10, 20, 25, 26, 3],
          },
        ],
      },
    });
  }
}
