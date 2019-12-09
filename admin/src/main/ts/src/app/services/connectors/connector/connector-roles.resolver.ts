import { map, catchError } from 'rxjs/operators';
import { ConnectorService } from './../../../api/connector.service';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router} from '@angular/router';
import { throwError } from 'rxjs';
import {globalStore} from '../../../core/store/global.store';
import {RoleModel} from '../../../core/store/models/role.model';
import { SpinnerService } from 'ngx-ode-ui';
import { NotifyService } from 'src/app/core/services/notify.service';
import { routing } from 'src/app/core/services/routing.service';

@Injectable()
export class ConnectorRolesResolver implements Resolve<RoleModel[]|Boolean> {

    constructor(
        private spinner: SpinnerService,
        private router: Router,
        private connectorService: ConnectorService,
        private ns: NotifyService
    ) { }

    resolve(route: ActivatedRouteSnapshot): Promise<any> {
        const structure = globalStore.structures.data.find(
            s => s.id === routing.getParam(route, 'structureId'));
        const connectorId = route.params.connectorId;
        const targetConnector = structure && structure.connectors.data.find(a => a.id === connectorId);

        if (!targetConnector) {
            this.router.navigate(['/admin', structure._id, 'services', 'connectors']);
        } else {
            return this.spinner.perform('portal-content', this.connectorService.syncRoles(targetConnector, structure)
            .pipe(
                map(() => targetConnector.roles),
                catchError(err => {
                    this.ns.error('user.root.error.text', 'user.root.error', err);
                    return throwError(err);
                })
            ).toPromise()
            );
        }
    }

}
