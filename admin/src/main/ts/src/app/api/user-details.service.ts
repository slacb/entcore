import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { UserModel } from 'src/app/core/store/models/user.model';
import { OdeHttpClient } from './../core/ode/OdeHttpClient';
import { UserDetailsModel } from './../core/store/models/userdetails.model';

@Injectable({
  providedIn: 'root'
})
export class UserDetailsService {

  constructor(private httpClient: OdeHttpClient) { }

  get(user: UserModel): Observable<UserDetailsModel> {
    return this.httpClient.Get(`/directory/user/${user.id}?manual-groups=true`);
  }

  update(userDetails: UserDetailsModel) {
    return this.httpClient.Put(`/directory/user/${userDetails.id}`, userDetails);
  }

  toggleBlock(userDetails: UserDetailsModel): Observable<any> {
      return this.httpClient.Put(`/auth/block/${userDetails.id}`, { block: !userDetails.blocked })
      .pipe(
        tap(() => {
          userDetails.blocked = !userDetails.blocked;
        })
      );
  }

  sendResetPassword(userDetails: UserDetailsModel, dest: {type: string, value: string}) {
      const payload = new window.URLSearchParams();
      payload.append('login', userDetails.login);
      if (dest.type === 'email') {
          payload.append('email', dest.value);
      } else if (dest.type === 'mobile') {
          payload.append('mobile', dest.value);
      }

      return this.httpClient.Post('/auth/sendResetPassword', payload);
  }

  sendIndividualMassMail(userDetails: UserDetailsModel, type: string) {
      return this.httpClient.Get<Blob>(`/directory/structure/massMail/${userDetails.id}/${type}`);
  }

  addRelative(userDetails: UserDetailsModel, parent) {
      return this.httpClient.Put(`/directory/user/${userDetails.id}/related/${parent.id}`, {});
  }

  removeRelative(userDetails: UserDetailsModel, parent) {
      return this.httpClient.Delete(`/directory/user/${userDetails.id}/related/${parent.id}`)
      .pipe(
        tap(() => {
          userDetails.parents = userDetails.parents.filter(p => p.id !== parent.id);
        })
      );
  }

  addChild(userDetails: UserDetailsModel, child) {
      return this.httpClient.Put(`/directory/user/${child.id}/related/${userDetails.id}`, {})
      .pipe(
        tap(() => {
          userDetails.children.push(child);
        })
      );
  }

  removeChild(userDetails: UserDetailsModel, child) {
      return this.httpClient.Delete(`/directory/user/${child.id}/related/${userDetails.id}`)
      .pipe(
        tap(() => {
          userDetails.children = userDetails.children.filter(c => c.id !== child.id);
        })
      );
  }

  deletePhoto(userDetails: UserDetailsModel) {
      return this.httpClient.Put(`/directory/userbook/${userDetails.id}`, {picture: ''});
  }

  addHeadTeacherManual(userDetails: UserDetailsModel, structureId: string, structureExternalId: string, classe: any) {
    const relationToAdd = classe.externalId;
    return this.httpClient.Post(`/directory/${structureId}/user/${userDetails.id}/headteacher`, {
        classExternalId: relationToAdd,
        structureExternalId
    })
    .pipe(
      tap(() => {
        if (userDetails.headTeacherManual === undefined) {
          userDetails.headTeacherManual = [];
        }
        userDetails.headTeacherManual.push(relationToAdd);
      })
    );
  }

  updateHeadTeacherManual(userDetails: UserDetailsModel, structureId: string, structureExternalId: string, classe: any) {
    const relationToRemove = classe.externalId;
    return this.httpClient.Put(`/directory/${structureId}/user/${userDetails.id}/headteacher`, {
        classExternalId: relationToRemove,
        structureExternalId
    })
    .pipe(
      tap(() => {
        userDetails.headTeacherManual.splice(userDetails.headTeacherManual.findIndex((f) => f === relationToRemove), 1);
      })
    );
  }

  addAdml(userDetails: UserDetailsModel, structureId) {
        return this.httpClient.Post(`/directory/user/function/${userDetails.id}`, {
            functionCode: 'ADMIN_LOCAL',
            inherit: 's',
            scope:  userDetails.functions.find((f) => f[0] === 'ADMIN_LOCAL') == null ? [structureId] : userDetails.functions.find((f) => f[0] === 'ADMIN_LOCAL')[1].concat(structureId)
        })
        .pipe(
          mergeMap((rRes: any) => this.httpClient.Get(`/directory/user/${userDetails.id}/functions`).pipe(
            tap(() => {
              userDetails.functions = rRes.data[0].functions;
            })
        )));
  }

  removeAdml(userDetails: UserDetailsModel) {
      return this.httpClient.Delete(`/directory/user/function/${userDetails.id}/ADMIN_LOCAL`)
      .pipe(
        tap(() => {
          userDetails.functions.splice(userDetails.functions.findIndex((f) => f[0] === 'ADMIN_LOCAL'), 1);
        })
      );
  }

  isAdml(userDetails: UserDetailsModel, structureId?: string) {
      if (userDetails.functions && userDetails.functions.length > 0) {
          const admlIndex = userDetails.functions.findIndex((f) => f[0] === 'ADMIN_LOCAL');
          if (admlIndex >= 0) {
              return userDetails.functions[admlIndex][1].includes(structureId);
          }
      }
  }

  isAdmc(userDetails: UserDetailsModel) {
      return userDetails.functions && userDetails.functions.find((f) => f[0] === 'SUPER_ADMIN');
  }

    /**
     * Détermine si l'utilisateur n'est pas un ensseignant ou professeur principal venant de l'AAF
     * @param {string} structureExternalId
     * @param {String} classeName
     * @returns {boolean}
     */
    isNotTeacherOrHeadTeacher(userDetails: UserDetailsModel, structureExternalId: string, classe: any) {
        if (userDetails.teaches === undefined) {
            return true;
        }

        if (userDetails.headTeacher && userDetails.headTeacher.length > 0) {
            const headTeacherIndex = userDetails.headTeacher.findIndex((f) => f === classe.externalId);
            return (headTeacherIndex >= 0);
        } else {
            return false;
        }
    }

    /**
     * Détermine si l'utilisateur est ensseignant et professeur principal venant de l'AAF
     * @param {string} structureExternalId
     * @param {String} classeName
     * @returns {boolean}
     */
    isTeacherAndHeadTeacherFromAAF(userDetails: UserDetailsModel, structureExternalId: string, classe: any) {
        if (userDetails.teaches === undefined) {
            return false;
        }

        if (userDetails.headTeacher && userDetails.headTeacher.length > 0) {
            const headTeacherIndex = userDetails.headTeacher.findIndex((f) => f === classe.externalId);
            return (headTeacherIndex >= 0);
        } else {
            return false;
        }
    }

    isHeadTeacherManual(userDetails: UserDetailsModel, structureExternalId: string,  classe: any) {
        if (userDetails.headTeacherManual && userDetails.headTeacherManual.length > 0) {
            const headTeacherManuelIndex = userDetails.headTeacherManual.findIndex((f) => f === classe.externalId);
            return (headTeacherManuelIndex >= 0);
        } else {
            return false;
        }
    }


    generateMergeKey(userDetails: UserDetailsModel) {
        return this.httpClient.Post(`/directory/duplicate/generate/mergeKey/${userDetails.id}`, {})
        .pipe(
          tap((res: any) => {
            userDetails.mergeKey = res.data.mergeKey;
          })
        );
    }

    updateLoginAlias(userDetails: UserDetailsModel) {
        return this.httpClient.Put(`/directory/user/${userDetails.id}`, {loginAlias: userDetails.loginAlias});
    }

    toJSON(userDetails: UserDetailsModel) {
      return {
          firstName:      userDetails.firstName,
          lastName:       userDetails.lastName,
          displayName:    userDetails.displayName,
          birthDate:      userDetails.birthDate,
          address:        userDetails.address,
          city:           userDetails.city,
          zipCode:        userDetails.zipCode,
          email:          userDetails.email,
          homePhone:      userDetails.homePhone,
          mobile:         userDetails.mobile
      };
  }
}
