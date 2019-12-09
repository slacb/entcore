import { Location } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { OdeComponent } from 'ngx-ode-core';
import { SelectOption, SpinnerService } from 'ngx-ode-ui';
import { tap, catchError } from 'rxjs/operators';
import { UserService } from './../../api/user.service';
import {ActivatedRoute, Data, Router} from '@angular/router';
import { Subscription, throwError } from 'rxjs';

import {UsersStore} from '../users.store';
import {routing} from '../../core/services/routing.service';
import {UserModel} from '../../core/store/models/user.model';
import { UserChildrenListService, UserListService } from 'src/app/core/services/userlist.service';
import { NotifyService } from 'src/app/core/services/notify.service';


@Component({
    selector: 'ode-user-create',
    templateUrl: './user-create.component.html'
    ,
    providers: [UserChildrenListService]
})
export class UserCreateComponent extends OdeComponent implements OnInit, OnDestroy {

    newUser: UserModel = new UserModel();
    noClasses: Array<any> = [];

    public typeOptions: SelectOption<string>[] = ['Teacher', 'Personnel', 'Relative', 'Student', 'Guest'].map(t => ({
        value: t,
        label: t
    }));
    public classeOptions: SelectOption<{ id: string, name: string }[]>[] = [];

    constructor(
        injector: Injector,
        public usersStore: UsersStore,
        private ns: NotifyService,
        private spinner: SpinnerService,
        private location: Location,
        private userListService: UserListService,
        private userService: UserService,
        public userChildrenListService: UserChildrenListService) {
            super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.usersStore.user = null;
        this.newUser.classes = null;
        this.newUser.type = 'Personnel';
        const {id, name} = this.usersStore.structure;
        this.newUser.structures = [{id, name}];
        this.classeOptions = [{value: null, label: 'create.user.sansclasse'}];

        this.subscriptions.add(routing.observe(this.route, 'data').subscribe((data: Data) => {
            if (data.structure) {
                this.newUser.structures = [data.structure];
                this.classeOptions = [{value: null, label: 'create.user.sansclasse'}];
                this.classeOptions.push(...this.usersStore.structure.classes.map(c => ({value: [c], label: c.name})));
            }
        }));
        this.newUser.userDetails.children = [];
    }

    createNewUser() {
        this.spinner.perform('portal-content', this.userService.createNewUser(this.newUser, this.usersStore.structure.id)
        .pipe(
            tap((res: any) => {
                this.ns.success({
                    key: 'notify.user.create.content',
                    parameters: {
                        user: this.newUser.firstName + ' ' + this.newUser.lastName
                    }
                }
                , 'notify.user.create.title');

                this.newUser.id = res.data.id;
                this.newUser.source = 'MANUAL';
                this.newUser.displayName = `${this.newUser.lastName} ${this.newUser.firstName}`;
                if (this.newUser.classes == null) {
                    this.newUser.classes = [];
                }
                this.usersStore.structure.users.data.push(this.newUser);

                this.router.navigate(['/admin', this.usersStore.structure.id, 'users', res.data.id, 'details'], {
                    relativeTo: this.route,
                    replaceUrl: false
                });
            }),
            catchError((err: any) => {
                this.ns.error({
                    key: 'notify.user.create.error.content',
                    parameters: {
                        user: this.newUser.firstName + ' ' + this.newUser.lastName
                    }
                }
                , 'notify.user.create.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    addChild(child) {
        if (this.newUser.userDetails.children.indexOf(child) < 0) {
            this.newUser.userDetails.children.push(child);
        }
    }

    removeChild(child) {
        const index = this.newUser.userDetails.children.indexOf(child);
        this.newUser.userDetails.children.splice(index, 1);
    }

    cancel() {
        this.location.back();
    }

    trim(input: string) {
        if (input && input.length > 0) {
            return input.trim();
        }
        return input;
    }
}
