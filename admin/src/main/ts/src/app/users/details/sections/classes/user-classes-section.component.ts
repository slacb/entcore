import { UserDetailsService } from './../../../../api/user-details.service';
import { catchError, tap } from 'rxjs/operators';
import { UserService } from './../../../../api/user.service';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, OnInit} from '@angular/core';

import {AbstractSection} from '../abstract.section';
import { SpinnerService } from 'ngx-ode-ui';
import { NotifyService } from 'src/app/core/services/notify.service';
import { Classe } from 'src/app/core/store/models/user.model';
import { Observable, throwError } from 'rxjs';

@Component({
    selector: 'ode-user-classes-section',
    templateUrl: './user-classes-section.component.html',
    inputs: ['user', 'structure'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserClassesSectionComponent extends AbstractSection implements OnInit, OnChanges {
    public lightboxClasses: { id: string, name: string }[] = [];
    public showClassesLightbox = false;
    public inputFilter = '';
    public filteredClasses: Classe[] = [];

    constructor(
        public spinner: SpinnerService,
        private ns: NotifyService,
        public userDetailsService: UserDetailsService,
        private userService: UserService,
        private cdRef: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        this.updateLightboxClasses();
        this.filterManageableGroups();
    }

    ngOnChanges() {
        this.updateLightboxClasses();
        this.filterManageableGroups();
    }

    private filterManageableGroups() {
        this.filteredClasses = !this.user ? [] :
            !this.user.classes ? [] :
                this.user.classes
                    .filter(group => !!this.structure.classes
                        .find(manageableClasse => manageableClasse.id === group.id));
    }

    private updateLightboxClasses() {
        this.lightboxClasses = this.structure.classes.filter(
            c => this.user.classes && !this.user.classes.find(uc => uc.id === c.id)
        );
    }

    filterByInput = (classe: { id: string, name: string }): boolean => {
        if (!this.inputFilter) {
            return true;
        }
        return `${classe.name}`.toLowerCase().indexOf(this.inputFilter.toLowerCase()) >= 0;
    }

    filterClasses = (classe: { id: string, name: string }): boolean => {
        return !this.user.classes.find(userClasse => classe.id === userClasse.id);
    }


    /**
     * Ajout du droit de professeur principal
     */
    addHeadTeacherManual(structureId: string, externalId: string, classe: any) {
        
        this.spinner.perform('portal-content', this.userDetailsService.addHeadTeacherManual(this.details, structureId, externalId, classe)
        .pipe(
            tap(() => {
                this.ns.success({
                    key: 'notify.user.add.head.teacher.content',
                    parameters: {user: this.user.firstName + ' ' + this.user.lastName}
                }, 'notify.user.add.head.teacher.title');
                this.cdRef.markForCheck();
            }),
            catchError(err => {
                this.ns.error({
                    key: 'notify.user.add.head.teacher.error.content',
                    parameters: {user: this.user.firstName + ' ' + this.user.lastName}
                }, 'notify.user.add.head.teacher.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    /**
     * Suppression du droit de professeur principal
     */
    updateHeadTeacherManual(structureId: string, externalId: string, classe: any) {

        this.spinner.perform('portal-content', this.userDetailsService.updateHeadTeacherManual(this.details, structureId, externalId, classe)
        .pipe(
            tap(() => {
                this.ns.success({
                    key: 'notify.user.remove.head.teacher.content',
                    parameters: {user: this.user.firstName + ' ' + this.user.lastName}
                }, 'notify.user.remove.head.teacher.title');
                this.cdRef.markForCheck();
            }),
            catchError(err => {
                this.ns.error({
                    key: 'notify.user.remove.head.teacher.error.content',
                    parameters: {user: this.user.firstName + ' ' + this.user.lastName}
                }, 'notify.user.remove.head.teacher.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    disableClass = (classe) => {
        return this.spinner.isLoading(classe.id);
    }

    addClass = (event) => {
        this.spinner.perform('portal-content', this.userService.addClass(this.user, event)
        .pipe(
            tap(() => {
                this.ns.success(
                    {
                        key: 'notify.user.add.class.content',
                        parameters: {
                            classe: event.name
                        }
                    }, 'notify.user.add.class.title');

                this.updateLightboxClasses();
                this.filterManageableGroups();
                this.cdRef.markForCheck();
            }),
            catchError( err => {
                this.ns.error(
                    {
                        key: 'notify.user.add.class.error.content',
                        parameters: {
                            classe: event.name
                        }
                    }, 'notify.user.add.class.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    removeClass = (classe) => {
        this.spinner.perform('portal-content', this.userService.removeClass(this.user, classe.id, classe.externalId)
            .pipe(
                tap(() => {
                    this.ns.success(
                        {
                            key: 'notify.user.remove.class.content',
                            parameters: {
                                classe: classe.name
                            }
                        }, 'notify.user.remove.class.title');

                    this.updateLightboxClasses();
                    this.filterManageableGroups();
                    this.cdRef.markForCheck();
                }),
                catchError(err => {
                    this.ns.error(
                        {
                            key: 'notify.user.remove.class.error.content',
                            parameters: {
                                classe: classe.name
                            }
                        }, 'notify.user.remove.class.error.title', err);
                    return throwError(err);
                })
        ).toPromise());
    }

    protected onUserChange() {
    }
}
