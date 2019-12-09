import { tap, catchError } from 'rxjs/operators';
import { UserDetailsService } from './../../../../api/user-details.service';
import {Component, ViewChild} from '@angular/core';
import {AbstractControl, NgForm} from '@angular/forms';

import {AbstractSection} from '../abstract.section';
import { throwError } from 'rxjs';
import {UserInfoService} from '../info/user-info.service';

import {globalStore} from '../../../../core/store/global.store';
import {UsersStore} from '../../../users.store';
import { NotifyService } from 'src/app/core/services/notify.service';
import { SpinnerService } from 'ngx-ode-ui';
import { UserListService } from 'src/app/core/services/userlist.service';

@Component({
    selector: 'ode-user-administrative-section',
    templateUrl: './user-administrative-section.component.html',
    inputs: ['user', 'structure']
})
export class UserAdministrativeSectionComponent extends AbstractSection {

    @ViewChild('administrativeForm', { static: false })
    administrativeForm: NgForm;

    @ViewChild('firstNameInput', { static: false })
    firstNameInput: AbstractControl;

    @ViewChild('lastNameInput', { static: false })
    lastNameInput: AbstractControl;

    constructor(
        private usersStore: UsersStore,
        private ns: NotifyService,
        private userDetailsService: UserDetailsService,
        public spinner: SpinnerService,
        private userListService: UserListService,
        private userInfoService: UserInfoService) {
        super();
    }

    protected onUserChange() {
        if (this.administrativeForm) {
            this.administrativeForm.reset(this.details && this.userDetailsService.toJSON(this.details));
        }
    }

    updateDetails() {
        this.spinner.perform('portal-content', this.userDetailsService.update(this.details)
        .pipe(
            tap(() => {
                if (this.firstNameInput && this.firstNameInput.dirty) {
                    this.user.firstName = this.details.firstName;
                }
                if (this.lastNameInput && this.lastNameInput.dirty) {
                    this.user.lastName = this.details.lastName;
                }
                this.updateInStructures();
                this.userListService.$updateSubject.next();

                this.administrativeForm.reset(this.details && this.userDetailsService.toJSON(this.details));

                this.ns.success(
                    {
                        key: 'notify.user.update.content',
                        parameters: {
                            user: this.details.firstName + ' ' + this.user.lastName
                        }
                    }, 'notify.user.update.title');

                this.userInfoService.setState(this.details);
            }),
            catchError(err => {
                this.ns.error(
                    {
                        key: 'notify.user.update.error.content',
                        parameters: {
                            user: this.user.firstName + ' ' + this.user.lastName
                        }
                    }, 'notify.user.update.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    private updateInStructures() {
        this.user.structures.forEach(us => {
            if (us.id !== this.usersStore.structure.id) {
                const s = globalStore.structures.data.find(gs => gs.id === us.id);
                if (s && s.users && s.users.data && s.users.data.length > 0) {
                    const u = s.users.data.find(_u => _u.id === this.user.id);
                    if (u) {
                        u.firstName = this.user.firstName;
                        u.lastName = this.user.lastName;
                    }
                }
            }
        });
    }
}
