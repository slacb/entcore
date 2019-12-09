import { map, tap } from 'rxjs/operators';
import { GroupsServiceService } from './../api/groups-service.service';
import { Observable, of } from 'rxjs';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';

import {globalStore} from '../core/store/global.store';
import {GroupModel} from '../core/store/models/group.model';
import {routing} from '../core/services/routing.service';
import {SpinnerService} from 'ngx-ode-ui';

@Injectable()
export class GroupsResolver implements Resolve<GroupModel[]> {

    constructor(private spinner: SpinnerService, private groupsService: GroupsServiceService ) {
    }

    resolve(route: ActivatedRouteSnapshot): Promise<GroupModel[]> {
        const currentStructure = globalStore.structures.data.find(
            s => s.id === routing.getParam(route, 'structureId')
        );
        if (currentStructure.groups.data.length > 0) {
            return Promise.resolve(currentStructure.groups.data);
        } else {

        const obs = this.groupsService.get(currentStructure).pipe(tap((res) => { console.log('res', res)}), map( () => currentStructure.groups.data));

        return this.spinner.perform('portal-content', obs.toPromise());
        }
    }
}
