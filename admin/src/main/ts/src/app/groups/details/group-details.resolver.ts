import { catchError } from 'rxjs/operators';
import { GroupsService } from './../../api/groups.service';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import { of } from 'rxjs';
import { GroupModel } from 'src/app/core/store/models/group.model';
import { GlobalStore } from 'src/app/core/store/global.store';
import { SpinnerService } from 'ngx-ode-ui';
import { NotifyService } from 'src/app/core/services/notify.service';
import { routing } from 'src/app/core/services/routing.service';

@Injectable()
export class GroupDetailsResolver implements Resolve<GroupModel> {

    constructor(
        private spinner: SpinnerService,
        private groupsService: GroupsService,
        private router: Router,
        private ns: NotifyService,
        private globalStore: GlobalStore
    ) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<GroupModel> {
        const structure = this.globalStore.structures.data.find(
            s => s.id === routing.getParam(route, 'structureId'));
        const groupType = routing.getParam(route, 'groupType');
        const groupId = route.params.groupId;
        const targetGroup: GroupModel = structure && structure.groups.data.find(g => g.id === groupId);

        if (!targetGroup) {
            this.router.navigate(['/admin', structure._id, 'groups', groupType]);
        }
        if (targetGroup.users && targetGroup.users.length < 1) {
            this.spinner.perform('groups-content', this.groupsService.syncUsers(targetGroup).pipe(
                catchError(
                    err => {
                        this.ns.error('user.root.error.text', 'user.root.error', err);
                        return of(targetGroup);
                    }
                )
            ).toPromise());
        }
        return Promise.resolve<GroupModel>(targetGroup);
    }
}
