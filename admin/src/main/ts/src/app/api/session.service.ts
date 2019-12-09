import { SessionModel } from 'src/app/core/store/models/session.model';
import { Session } from './../core/store/mappings/session';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private httpClient: OdeHttpClient) { }



  public get(): Observable<Session> {
    return this.httpClient.Get('/auth/oauth2/userinfo')
    .pipe(
      tap( (data: Session) => {
        SessionModel.session = data;
        return data;
      })
    );




  //   return new Promise((resolve, reject) => {
  //     http.get('/auth/oauth2/userinfo')
  //     .then(result => {
  //         SessionModel.session = result.data as Session;
  //         resolve(SessionModel.session);
  //     }, e => {
  //         console.error(e);
  //         resolve(new Session());
  //     });
  // });
  }
}
