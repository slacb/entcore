import { UserDetailsModel } from 'src/app/core/store/models/userdetails.model';
import { ProfileServiceService } from './profile-service.service';
import { GroupModel } from './../core/store/models/group.model';
import { GroupsServiceService } from './groups-service.service';
import { Classe, UserModel } from 'src/app/core/store/models/user.model';
import { StructureModel } from './../core/store/models/structure.model';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, map, mergeMap } from 'rxjs/operators';
import { GroupCollection } from '../core/store/collections/group.collection';

@Injectable({
  providedIn: 'root'
})
export class StructureService {

  constructor(private httpClient: OdeHttpClient,
              private groupsService: GroupsServiceService,
              private profileService: ProfileServiceService) {}

  syncUsers(structure: StructureModel): Observable<UserModel[]> {
    return this.httpClient.Get(`/directory/structure/${structure.id}/users`)
    .pipe(
      map( (users: UserModel[]) => {
        for (const user of users ) {
          user.userDetails = new UserDetailsModel();
        }
        structure.users.data = users;
        return users;
      })
    );

  }
  quickSearchUsers(structure: StructureModel, input: string): Observable<any> {
    const params = new HttpParams();
    params.set('input', input);
    return this.httpClient.Get(`/directory/structure/${structure.id}/quicksearch/users`, {
        params
    })
    .pipe(
      tap( res => {
        console.log('quickSearchUsers', res);
      })
    );
  }


  syncClasses(structure: StructureModel, force?: boolean): Observable<StructureModel> {
    if (!structure.classes) { structure.classes = []; }
    if ((structure.classes.length < 1 || force === true)) {

      const params = new HttpParams()
      .set('structureId', structure.id);

      return this.httpClient.Get('/directory/class/admin/list', {params})
      .pipe(
        map( (res: Classe[]) => {
            structure.classes = res;
            return structure;
        }));
    } else {
      return of<StructureModel>(structure);
    }
  }

  syncGroups(structure: StructureModel, force?: boolean): Observable<StructureModel> {
    if (!structure.groups) { structure.groups = new GroupCollection(); }
    if (structure.groups.data.length < 1 || force === true) {
          return this.groupsService.get(structure, true)
          .pipe(
            map( (groups: GroupModel[]) => {
              structure.groups = new GroupCollection();
              structure.groups.data = groups;
              return structure;
            })
          );
      } else {
        return of<StructureModel>(structure);
      }
  }

  syncSources(structure: StructureModel, force?: boolean): Observable<StructureModel> {
      if (!structure.sources) { structure.sources = []; }
      if (structure.sources.length < 1 || force === true) {
          return this.httpClient.Get(`/directory/structure/${structure.id}/sources`)
          .pipe(
            map( (sources: string[]) => {
              structure.sources = sources;
              return structure;
            })
          );
      } else {
        return of<StructureModel>(structure);
      }
  }

  syncAafFunctions(structure: StructureModel, force?: boolean): Observable<StructureModel> {
    if (!structure.aafFunctions) { structure.aafFunctions = []; }
    if (structure.aafFunctions.length < 1 || force === true) {
        return this.httpClient.Get(`/directory/structure/${structure.id}/aaffunctions`)
        .pipe(
          tap( (res: any) => {
            if (res.data && res.data.length > 0
              && res.data[0].aafFunctions && res.data[0].aafFunctions.length > 0) {
              structure.aafFunctions = res.data[0].aafFunctions;
              return structure;
          }
          })
        );
    } else {
      return of<StructureModel>(structure);
    }
  }

  sync(structure: StructureModel, force?: boolean): Observable<StructureModel> {
      return this.syncClasses(structure)
          .pipe(
              mergeMap( () => this.syncGroups(structure)),
              mergeMap(() => this.syncSources(structure)),
              mergeMap(() => this.syncAafFunctions(structure)),
              mergeMap(() => this.profileService.getProfiles()
              .pipe(
                  map( (profiles: any) => {
                      structure.profiles = profiles;
                      return structure;
                  })
              ))
          );
  }
}
