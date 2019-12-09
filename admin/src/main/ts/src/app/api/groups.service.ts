import { UserModel } from 'src/app/core/store/models/user.model';
import { StructureModel } from 'src/app/core/store/models/structure.model';
import { GroupModel } from './../core/store/models/group.model';
import { tap, map } from 'rxjs/operators';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  constructor(private httpClient: OdeHttpClient) { }


  public get(structure: StructureModel) {
    return this.httpClient.Get(`directory/group/admin/list?structureId=${structure.id}&translate=:translate`);
  }

  syncUsers(group: GroupModel) {
    return this.httpClient.Get(`/directory/user/admin/list?groupId=${group.id}`)
      .pipe(
        map((res: any) => {
          group.users = res;
          return group;
          }
        )
      );
  }

  addUsers(group: GroupModel, users: UserModel[]): Observable<any> {
    return this.httpClient.put(`/directory/group/${group.id}/users/add`, {userIds: users.map(u => u.id)});
  }

  removeUsers(group: GroupModel, users: UserModel[]) {
      return this.httpClient.Put(`/directory/group/${group.id}/users/delete`, {userIds: users.map(u => u.id)});
  }

  toJSON(group: GroupModel) {
    return {
        name: group.name,
        structureId: group.structureId
    };
}

}
