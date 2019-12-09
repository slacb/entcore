import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { Data } from '@angular/router';
import { OdeComponent } from 'ngx-ode-core';
import { RoleService } from './../../../../api/role.service';
import { ApplicationService } from './../../../../api/application.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {ServicesStore} from '../../../services.store';
import {ServicesService} from '../../../services.service';
import {routing} from '../../../../core/services/routing.service';
import { GroupModel } from 'src/app/core/store/models/group.model';
import { RoleModel } from 'src/app/core/store/models/role.model';
import { StructureModel } from 'src/app/core/store/models/structure.model';

@Component({
    selector: 'ode-smart-application',
    templateUrl: './smart-application.component.html',
    styles: [`
        button.tab {
            border-left: 0;
            box-shadow: none;
            border-right: 0;
            border-top: 0;
            margin: 0 10px;
            padding-left: 10px;
            padding-right: 10px;
        }
    `, `
        button.tab:not(active):hover {
            color: #ff8352;
            background-color: #fff;
            border-bottom-color: #ff8352;
        }
    `]
})
export class SmartApplicationComponent extends OdeComponent implements OnInit, OnDestroy {
    public currentTab: 'assignment' | 'massAssignment' = 'assignment';


    public assignmentGroupPickerList: GroupModel[];

    constructor(injector: Injector,
                private roleService: RoleService,
                public servicesStore: ServicesStore,
                private applicationService: ApplicationService,
                private servicesService: ServicesService) {
                    super(injector);
    }

    ngOnInit(): void {
            super.ngOnInit();
            this.subscriptions.add(this.route.params.subscribe(params => {
                if (params.appId) {
                    this.servicesStore.application = this.servicesStore.structure
                        .applications.data.find(a => a.id === params.appId);
                }
            }));

            this.subscriptions.add(this.route.data.subscribe(data => {
                if (data.roles) {
                    this.servicesStore.application.roles = data.roles;
                    this.servicesStore.application.roles = filterRolesByDistributions(
                        this.servicesStore.application.roles.filter(r => r.transverse === false),
                        this.servicesStore.structure.distributions);
                }
            }));

            this.subscriptions.add(routing.observe(this.route, 'data').subscribe((data: Data) => {
                if (data.structure) {
                    this.assignmentGroupPickerList = this.servicesStore.structure.groups.data;
                    if (!this.structureHasChildren(this.servicesStore.structure) && this.currentTab === 'massAssignment') {
                        this.currentTab = 'assignment';
                    }
                }
            }));
        }

    public onAddAssignment($event: {group: GroupModel, role: RoleModel}) {
        this.roleService.addGroup($event.role, $event.group).subscribe(() => {});
    }

    public onRemoveAssignment($event: {group: GroupModel, role: RoleModel}): void {
        this.roleService.removeGroup($event.role, $event.group).subscribe(() => {});
    }

    public onMassAssignment(): void {
        this.applicationService.get(this.servicesStore.application, this.servicesStore.structure.id)
        .subscribe(() => {
            this.servicesStore.application.roles = filterRolesByDistributions(
                this.servicesStore.application.roles.filter(r => r.transverse === false),
                this.servicesStore.structure.distributions);
        });
    }

    public structureHasChildren(structure: StructureModel): boolean {
        return structure.children && structure.children.length > 0;
    }
}

export function filterRolesByDistributions(roles: RoleModel[], distributions: string[]): RoleModel[] {
    return roles.filter(role => {
        if (role.distributions.length === 0) {
            return true;
        }
        return distributions.some(distribution => role.distributions.indexOf(distribution) >= 0);
    });
}
