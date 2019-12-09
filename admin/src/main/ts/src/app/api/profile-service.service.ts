import { tap, map } from 'rxjs/operators';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';

export interface ProfileItem {
  name: string;
  blocked: any;
}


@Injectable({
  providedIn: 'root'
})
export class ProfileServiceService {
  // TODO: Change classname
  private static profiles: Array<ProfileItem>;

  constructor(private httpClient: OdeHttpClient) {}

  public getProfiles(): Observable<Array<ProfileItem>> {
    if (!ProfileServiceService.profiles) {
        return this.httpClient.Get('/directory/profiles')
        .pipe(
          tap( (res: any) => {
            ProfileServiceService.profiles = res as Array<ProfileItem>;
          })
        );
    } else {
        return of<Array<ProfileItem>>(ProfileServiceService.profiles);
    }
  }
}
