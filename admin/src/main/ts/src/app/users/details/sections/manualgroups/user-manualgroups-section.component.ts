import { UserService } from './../../../../api/user.service';
import { convertToParamMap } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit} from '@angular/core';

import {AbstractSection} from '../abstract.section';
import { GroupModel } from 'src/app/core/store/models/group.model';
import { UserModel } from 'src/app/core/store/models/user.model';
import { SpinnerService } from 'ngx-ode-ui';
import { StructureModel } from 'src/app/core/store/models/structure.model';
import { NotifyService } from 'src/app/core/services/notify.service';
import { throwError } from 'rxjs';

@Component({
    selector: 'ode-user-manualgroups-section',
    templateUrl: './user-manualgroups-section.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManualgroupsSectionComponent extends AbstractSection implements OnInit, OnChanges {
    public filteredGroups: GroupModel[] = [];
    public lightboxManualGroups: GroupModel[] = [];
    public inputFilter = '';
    public showGroupLightbox = false;

    @Input()
    public user: UserModel;
    @Input()
    public structure: StructureModel;

    constructor(
        public spinner: SpinnerService,
        private notifyService: NotifyService,
        private userService: UserService,
        private changeDetectorRef: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        this.updateLightboxManualGroups();
        this.filterManageableGroups();
    }

    ngOnChanges() {
        this.updateLightboxManualGroups();
        this.filterManageableGroups();
    }

    private filterManageableGroups() {
        this.filteredGroups = !this.details ? [] :
            !this.details.manualGroups ? [] :
                this.details.manualGroups
                    .filter(group => !!this.structure.groups.data
                        .find(manageableGroup =>
                            (manageableGroup.type === 'ManualGroup') && (manageableGroup.id === group.id)));
    }

    private updateLightboxManualGroups() {
        this.lightboxManualGroups = this.structure.groups.data.filter(
            group => group.type === 'ManualGroup'
                && this.details.manualGroups
                && !this.details.manualGroups.find(manualGroup => manualGroup.id == group.id));
    }

    filterByInput = (manualGroup: { id: string, name: string }): boolean => {
        if (!this.inputFilter) {
            return true;
        }
        return `${manualGroup.name}`.toLowerCase().indexOf(this.inputFilter.toLowerCase()) >= 0;
    }

    disableGroup = (manualGroup) => {
        return this.spinner.isLoading(manualGroup.id);
    }

    addGroup = (group) => {
        return this.spinner.perform('portal-content', this.userService.addManualGroup(this.user, group)
        .pipe(
            tap(() => {
                this.notifyService.success(
                    {
                        key: 'notify.user.add.group.content',
                        parameters: {
                            group: group.name
                        }
                    }, 'notify.user.add.group.title');

                this.updateLightboxManualGroups();
                this.filterManageableGroups();
                this.changeDetectorRef.markForCheck();
            }),
            catchError(err => {
                this.notifyService.error(
                    {
                        key: 'notify.user.add.group.error.content',
                        parameters: {
                            group: group.name
                        }
                    }, 'notify.user.add.group.error.title', err);
                return throwError(err);
            })
        ).toPromise());
    }

    removeGroup = (group) => {
        return this.spinner.perform('portal-content', this.userService.removeManualGroup(this.user, group)
        .pipe(
            tap(() => {
                this.notifyService.success(
                    {
                        key: 'notify.user.remove.group.content',
                        parameters: {
                            group: group.name
                        }
                    }, 'notify.user.remove.group.title');

                this.updateLightboxManualGroups();
                this.filterManageableGroups();
                this.changeDetectorRef.markForCheck();
            }),
            catchError(err => {
                this.notifyService.error(
                    {
                        key: 'notify.user.remove.group.error.content',
                        parameters: {
                            group: group.name
                        }
                    }, 'notify.user.remove.group.error.title', err);
                return throwError(err);
            })
        ).toPromise()
        );
    }

    protected onUserChange() {
    }
}
