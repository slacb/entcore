import { ConfigService } from './../../api/config.service';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {Config} from './Config';

@Injectable()
export class ConfigResolver implements Resolve<Config> {
    constructor(private configService: ConfigService) {
    }

    resolve(route: ActivatedRouteSnapshot): Observable<Config> {
        return this.configService.get();
    }
}
