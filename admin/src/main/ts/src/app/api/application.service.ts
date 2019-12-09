import { RoleModel } from './../core/store/models/role.model';
import { Mix } from 'entcore-toolkit';
import { tap } from 'rxjs/operators';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Observable } from 'rxjs';
import { ApplicationModel } from './../core/store/models/application.model';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  constructor(private httpClient: OdeHttpClient) { }


  get(application: ApplicationModel, structureId: string): Observable<any> {
    return this.httpClient.Get(`/appregistry/structure/${structureId}/application/${application.id}/groups/roles`)
    .pipe(
      tap(res => {
        console.log('get Application', res);
        application.roles = Mix.castArrayAs(RoleModel, res.data);
      })
    );
}
}
