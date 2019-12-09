import { AfterViewInit, ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { OdeComponent } from 'ngx-ode-core';
import { StructureModel } from '../../../core/store/models/structure.model';
import { StructureService } from './../../../api/structure.service';

@Component({
    selector: 'ode-user-search-card',
    templateUrl: './user-search-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSearchCardComponent extends OdeComponent implements AfterViewInit {

    loading = false;
    foundUsers: Array<{id: string, firstName: string, lastName: string}> = [];

    constructor(injector: Injector, private structureService: StructureService) {
        super(injector);
    }

    @Input() structure: StructureModel;
    private _inputValue: string;
    get inputValue() { return this._inputValue; }
    set inputValue(value) {
        this._inputValue = value;
        if (this._inputValue && !this.loading) {
            this.loading = true;

            this.structureService.quickSearchUsers(this.structure, this._inputValue)
            .subscribe(res => {
                this.foundUsers = res;
                this.loading = false;
                this.changeDetector.markForCheck();
            }, err => {
                console.error(err);
            });
        } else {
            this.foundUsers = [];
        }
        this.changeDetector.markForCheck();
    }

    ngAfterViewInit() {
        this.changeDetector.markForCheck();
        this.changeDetector.detectChanges();
    }
}
