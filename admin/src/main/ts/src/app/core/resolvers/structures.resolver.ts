import { StructureModel } from './../store/models/structure.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { StructuresService } from '../../api/structures.service';
import { Logger } from 'ngx-ode-core';


@Injectable()
export class StructuresResolver implements Resolve<StructureModel[]> {
    constructor(private structuresServices: StructuresService,
                private logger: Logger) {
    }

    resolve(): Observable<StructureModel[]> {
        return this.structuresServices.get();
    }

    handleError(route: ActivatedRouteSnapshot, errorResponse: HttpErrorResponse) {
        // TODO: Handle errors
        this.logger.error('ERROR', this,  errorResponse);
    }
}
