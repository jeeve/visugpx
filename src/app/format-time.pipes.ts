import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'formatTime'})
export class FormatTime implements PipeTransform {
  constructor() {}

  transform(value: number): string {
    return new Date(value * 1000).toISOString().substr(11, 8)
  }
}