import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { ChartComponent } from './chart/chart.component';
import { ControlComponent } from './control/control.component';
import { FormsModule } from '@angular/forms';
import { StatComponent } from './stat/stat.component';
import { FormatTime } from './format-time.pipes';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ChartComponent,
    ControlComponent,
    StatComponent, FormatTime
  ],
  imports: [
    BrowserModule, HttpClientModule, FormsModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
