import { tap, catchError } from 'rxjs/operators';
import { UserDetailsService } from './../../../../api/user-details.service';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, OnInit} from '@angular/core';
import { throwError } from 'rxjs';
import {AbstractSection} from '../abstract.section';
import {UserModel} from '../../../../core/store/models/user.model';
import { UserListService } from 'src/app/core/services/userlist.service';
import { SpinnerService } from 'ngx-ode-ui';
import { NotifyService } from 'src/app/core/services/notify.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
    selector: 'ode-user-relatives-section',
    templateUrl: './user-relatives-section.component.html',
    inputs: ['user', 'structure'],
    providers: [ UserListService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserRelativesSectionComponent extends AbstractSection implements OnInit, OnChanges {
    public showRelativesLightbox = false;

    lightboxRelatives: UserModel[] = [];

    constructor(
        public userListService: UserListService,
        private userDetailsService: UserDetailsService,
        public spinner: SpinnerService,
        private ns: NotifyService,
        protected cdRef: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        this.updateLightboxRelatives();
    }

    ngOnChanges() {
        this.updateLightboxRelatives();
    }

    private updateLightboxRelatives() {
        this.lightboxRelatives = this.structure.users.data.filter(
            u => u.type == 'Relative'
                && !u.deleteDate
                && this.details.parents
                && !this.details.parents.find(p => p.id == u.id)
        );
    }

    protected onUserChange() {}

    isStudent(u: UserModel) {
        return u.type === 'Student';
    }

    disableRelative = (relative) => {
        return this.spinner.isLoading(relative.id);
    }

    addRelative = (relative) => {
        
        this.spinner.perform('portal-content', this.userDetailsService.addRelative(this.details, relative)
        .pipe(
            tap(() => {
                this.ns.success(
                    {
                        key: 'notify.user.add.relative.content',
                        parameters: {
                            relative:  relative.displayName
                        }
                    }, 'notify.user.add.relative.title');

                this.updateLightboxRelatives();
                this.cdRef.markForCheck();
            }),
            catchError(err => {
                this.ns.error(
                    {
                        key: 'notify.user.add.relative.error.content',
                        parameters: {
                            relative:  relative.displayName
                        }
                    }, 'notify.user.add.relative.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    removeRelative = (relative) => {
        this.spinner.perform('portal-content', this.userDetailsService.removeRelative(this.details, relative)
        .pipe(
            tap(() => {
                this.ns.success(
                    {
                        key: 'notify.user.remove.relative.content',
                        parameters: {
                            relative:  relative.displayName
                        }
                    }, 'notify.user.remove.relative.title');

                this.updateLightboxRelatives();
                this.cdRef.markForCheck();
            }),
            catchError(err => {
                this.ns.error(
                    {
                        key: 'notify.user.remove.relative.error.content',
                        parameters: {
                            relative:  relative.displayName
                        }
                    }, 'notify.user.remove.relative.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }
}
