import { Observable } from 'rxjs';
import { Config } from './../core/resolvers/Config';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor(private httpClient: OdeHttpClient) {}

  public get(): Observable<Config> {
    return this.httpClient.Get<Config>('/admin/api/platform/config')
    .pipe(
      tap ( (data: Config) => {
        console.log('CONFIG DATA', data);
      })
    );
  }

}
