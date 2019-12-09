import { tap } from 'rxjs/operators';
import { StructureService } from './../api/structure.service';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';

import { StructureModel } from '../core/store/models/structure.model';
import { globalStore } from '../core/store/global.store';
import { SpinnerService } from 'ngx-ode-ui';

@Injectable({providedIn: 'root'})
export class StructureResolver implements Resolve<StructureModel> {

    constructor(private spinner: SpinnerService,
                private structureService: StructureService) {}

    resolve(route: ActivatedRouteSnapshot): Promise<StructureModel> {
        const structure: StructureModel = globalStore.structures.data.find(s => s.id === route.params.structureId);
        if (!structure) {
            return new Promise((res, rej) => {
                rej('structure.not.found');
            });
        }


        return this.spinner.perform('portal-content', this.structureService.sync(structure).pipe(tap((res) => { console.log({'structure': res}); })).toPromise());
    }

}

