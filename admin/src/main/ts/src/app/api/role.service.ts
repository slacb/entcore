import { tap } from 'rxjs/operators';
import { RoleModel } from 'src/app/core/store/models/role.model';
import { GroupModel } from 'src/app/core/store/models/group.model';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private httpClient: OdeHttpClient) { }


  removeGroup(role: RoleModel , group: GroupModel): Observable<any> {
      return this.httpClient
          .Delete(`/appregistry/authorize/group/${group.id}/role/${role.id}`, {})
          .pipe(
            tap(res => {
              const groupIndex = role.groups.findIndex(g => g.id === group.id);
              role.groups.splice(groupIndex, 1);
            })
          );
  }

  addGroup(role: RoleModel, group: GroupModel) {
      return this.httpClient.Put(`/appregistry/authorize/group/${group.id}/role/${role.id}`, {})
      .pipe(
        tap(() => {
          role.groups.push(group);
        })
      );
  }
}