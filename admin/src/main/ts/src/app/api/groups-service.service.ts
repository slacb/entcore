import { map } from 'rxjs/operators';
import { StructureModel } from 'src/app/core/store/models/structure.model';
import { Observable } from 'rxjs';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { GroupModel } from '../core/store/models/group.model';

@Injectable({
  providedIn: 'root'
})
export class GroupsServiceService {
  // TODO: Change classname
  constructor(private httpClient: OdeHttpClient) { }

  get(structure: StructureModel, translate: boolean = true): Observable<GroupModel[]> {
    return this.httpClient.Get(`/directory/group/admin/list?structureId=${structure.id}&translate=${translate}`)
    .pipe(
      map( (groups: GroupModel[]) => {
          const g: GroupModel[] = [];
          for ( const group of groups) {
            g.push(Object.assign(new GroupModel(), group));
          }
          return g;
      })
    );
  }
}
