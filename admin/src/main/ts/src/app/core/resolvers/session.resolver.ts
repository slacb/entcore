import { SessionService } from './../../api/session.service';
import { Observable, of } from 'rxjs';
import {Injectable} from '@angular/core';
import {Resolve} from '@angular/router';
import { Session } from '../store/mappings/session';
import { SessionModel } from '../store/models/session.model';

@Injectable()
export class SessionResolver implements Resolve<Session> {

    constructor(private sessionService: SessionService) {}

    resolve(): Observable<Session> {
        if (!SessionModel.session) {
            return this.sessionService.get();
        } else {
            return of(SessionModel.session);
        }
    }
}
