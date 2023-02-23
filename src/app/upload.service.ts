import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private httpClient: HttpClient) {}

  public uploadfile(file: File) {
    let formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post('fileupload.php', formData, { responseType: 'text' });
  }
}
