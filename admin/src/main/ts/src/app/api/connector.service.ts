import { RoleModel } from 'src/app/core/store/models/role.model';
import { Mix } from 'entcore-toolkit';
import { tap } from 'rxjs/operators';
import { StructureModel } from 'src/app/core/store/models/structure.model';
import { ConnectorModel } from 'src/app/core/store/models/connector.model';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ConnectorService {

  constructor(private httpClient: OdeHttpClient) { }

  syncRoles = (connector: ConnectorModel, structure: StructureModel): Observable<any> => {
      return this.httpClient.Get(`/appregistry/application/external/${connector.id}/groups/roles?structureId=${structure.id}`)
      .pipe(
        tap((res: any) => {
          connector.roles = Mix.castArrayAs(RoleModel, res.data);
        })
      );
  }
}
