import { UserDetailsService } from './user-details.service';
import { GroupModel } from './../core/store/models/group.model';
import { StructureModel } from './../core/store/models/structure.model';
import { UserModel, Classe } from 'src/app/core/store/models/user.model';
import { tap, map, mergeMap, catchError } from 'rxjs/operators';
import { UsedSpace } from './../users/details/sections/quota/UsedSpace';
import { OdeHttpClient, IRequestOptions } from './../core/ode/OdeHttpClient';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { globalStore } from './../core/store/global.store';
import { Injectable, Pipe } from '@angular/core';
import { Observable, throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: OdeHttpClient, private userDetailsService: UserDetailsService) { }

  delete(user: UserModel, params?: any) {
    return this.httpClient.Delete('/directory/user',{params: new HttpParams().set('userId', user.id)} );
  }
  visibleStructures(user: UserModel): Array<{ id: string; name: string; }> {
      return user.structures.filter(structure => globalStore.structures.data
          .find(manageableStructure => manageableStructure.id === structure.id));
  }
  invisibleStructures(user: UserModel): Array<{ id: string; name: string; }> {
      return user.structures.filter(structure => globalStore.structures.data
          .every(manageableStructure => manageableStructure.id !== structure.id));
  }

  getQuota(user: UserModel): Observable<UsedSpace> {
    return this.httpClient.Get<UsedSpace>(`/workspace/quota/user/${user.id}`)
      .pipe(
        map((data: UsedSpace) => {
          user.userDetails.storage = data.storage;
          user.userDetails.quota = data.quota;
          return {
            storage: data.storage,
            quota: data.quota
          } as UsedSpace;

      })
    );
  }

  addStructure(user: UserModel, structureId: string): Observable<unknown> {
      return this.httpClient.Put<unknown>(`/directory/structure/${structureId}/link/${user.id}`, {})
        .pipe(
          tap(() => {
            const targetStructure = globalStore.structures.data.find(s => s.id === structureId);
            if (targetStructure) {
                user.structures.push({id: targetStructure.id, name: targetStructure.name});
                if (targetStructure.users.data.length > 0) {
                    targetStructure.users.data.push(user);
                }
            }
          })
        );
  }

  removeStructure(user: UserModel, structureId: string): Observable<unknown> {
      return this.httpClient.Delete(`/directory/structure/${structureId}/unlink/${user.id}`)
          .pipe(
            tap(() => {
              user.structures = user.structures.filter(s => s.id !== structureId);
              const targetStructure = globalStore.structures.data.find(s => s.id === structureId);
              if (targetStructure && targetStructure.users.data.length > 0) {
                  targetStructure.users.data = targetStructure.users.data
                      .filter(u => u.id !== user.id);
              }
            })
          );
  }

  addClass(user: UserModel, classe: Classe): Observable<unknown> {
      return this.httpClient.Put(`/directory/class/${classe.id}/link/${user.id}`, {})
      .pipe(
        tap(() => {
          user.classes.push(classe);
        })
      );
  }

  removeClass(user: UserModel, classId: string, externalId: string): Observable<unknown> {
    return this.httpClient.Delete(`/directory/class/${classId}/unlink/${user.id}`)
      .pipe(
        tap(() => {
          user.classes = user.classes.filter(c => c.id !== classId);
          if (user.userDetails.headTeacherManual) {
                  user.userDetails.headTeacherManual
                      .splice(user.userDetails.headTeacherManual.findIndex((f) => f === externalId), 1);
              }
        })
      );
  }

  addManualGroup(user: UserModel, group: GroupModel): Observable<unknown> {
    return this.httpClient.Post(`/directory/user/group/${user.id}/${group.id}`, {})
      .pipe(
        tap(() => {
          user.manualGroups.push(group.name);
          user.userDetails.manualGroups.push(group);
        })
      );
  }

  removeManualGroup(user: UserModel, group: GroupModel): Observable<unknown> {
    return this.httpClient.Delete(`/directory/user/group/${user.id}/${group.id}`)
      .pipe(
        tap(() => {
          user.manualGroups = user.manualGroups.filter(mg => mg === group.name);
            user.userDetails.manualGroups = user.userDetails.manualGroups
            .filter(mg => group.id !== mg.id);
        })
      );
  }

  addFunctionalGroup(user: UserModel, group: GroupModel): Observable<unknown> {
    return this.httpClient.Post(`/directory/user/group/${user.id}/${group.id}`, {})
      .pipe(
        tap(() => {
          user.functionalGroups.push(group.name);
          user.userDetails.functionalGroups.push(group);
        })
      );
  }

  removeFunctionalGroup(user: UserModel, group: GroupModel): Observable<unknown> {
    return this.httpClient.Delete(`/directory/user/group/${user.id}/${group.id}`)
      .pipe(
        tap(() => {
          user.functionalGroups = user.functionalGroups.filter(fg => fg === group.name);
          user.userDetails.functionalGroups = user.userDetails.functionalGroups
                  .filter(fg => group.id !== fg.id);
        })
      );
  }

  mergeDuplicate(user: UserModel, duplicateId: string): Observable<{ id: string, structure?: { id: string, name: string } }> {
    const duplicate = user.duplicates.find(d => d.id === duplicateId);
    return this.httpClient.Put(`/directory/duplicate/merge/${user.id}/${duplicateId}`, {})
      .pipe(
        tap((result: any) => {
          user.duplicates = user.duplicates.filter(d => d.id !== duplicateId);
        } ),
        mergeMap( (data: any) => this.userDetailsService.get(user).pipe(map(() => { return {id: user.id}; } ))),
        catchError(e => throwError({id: duplicate.id, structure: duplicate.structures[0]}))
      );
  }

  separateDuplicate(user: UserModel, duplicateId: string) {
    return this.httpClient.Delete(`/directory/duplicate/ignore/${user.id}/${duplicateId}`)
      .pipe(
        tap(() => {
          const duplicate = user.duplicates.find(d => d.id === duplicateId);
          duplicate.structures.forEach(duplicatedStructure => {
              const structure = globalStore.structures.data.find(struct => struct.id === duplicatedStructure.id);
              if (structure && structure.users.data.length > 0) {
                  const dUser = structure.users.data.find(rUser => rUser.id === duplicateId);
                  if (dUser) { dUser.duplicates = dUser.duplicates.filter(d => d.id !== user.id); }
              }
          });
          user.duplicates = user.duplicates.filter(d => d.id !== duplicateId);
        })
      );
  }

  createNewUser(user: UserModel, structureId): Observable<any> {
      const userPayload = new window.URLSearchParams();

      userPayload.append('firstName', user.firstName.trim());
      userPayload.append('lastName', user.lastName.trim());
      userPayload.append('type', user.type);
      if (user.classes && user.classes.length > 0) {
          userPayload.append('classId', user.classes[0].id);
      }
      userPayload.append('structureId', structureId);
      userPayload.append('birthDate', user.userDetails.birthDate);
      user.userDetails.children.forEach(child => userPayload.append('childrenIds', child.id));

      const options: IRequestOptions = {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
      };
      return this.httpClient.Post('/directory/api/user'
          , userPayload
          , options);
  }

  restore(user: UserModel) {
    return this.httpClient.Put('/directory/restore/user', {params: {userId: user.id}})
      .pipe(
        tap(() => {
          user.deleteDate = null;
          user.disappearanceDate = null;
        })
      );
  }
}
