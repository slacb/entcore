import { UserCollection } from './../core/store/collections/user.collection';
import { StructureService } from './../api/structure.service';
import { Subscription, Observable, of } from 'rxjs';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {routing} from '../core/services/routing.service';

import {SpinnerService} from 'ngx-ode-ui';
import { UserModel } from '../core/store/models/user.model';
import { StructureModel } from '../core/store/models/structure.model';
import { globalStore } from '../core/store/global.store';

@Injectable()
export class UsersResolver implements Resolve<UserModel[]> {

    constructor(private spinner: SpinnerService,
                private structureService: StructureService) {
    }

    resolve(route: ActivatedRouteSnapshot): Promise<UserModel[]> {
        const currentStructure: StructureModel = globalStore.structures.data.find(s => s.id === routing.getParam(route, 'structureId'));
        console.log('current structure', currentStructure);
        if (route.queryParams.sync) {
            this.structureService.sync(currentStructure, true).subscribe(() => {console.log('CURRENT STRUCTURE', currentStructure);});
        }
        if (!currentStructure.users) {currentStructure.users = new UserCollection(); }
        if (currentStructure.users.data.length > 0 && !route.queryParams.sync) {
            return Promise.resolve(currentStructure.users.data);
        } else {
            return this.spinner.perform('portal-content', this.structureService.syncUsers(currentStructure).toPromise());
        }
    }
}
