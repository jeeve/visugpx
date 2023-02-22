import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private httpClient: HttpClient) {}

  public uploadfile(file: File) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'multipart/form-data',
      }),
    };

    let formParams = new FormData();
    formParams.append('file', file);
    return this.httpClient.post('fileupload.php', formParams, httpOptions);
  }
}
