import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OdeComponent } from 'ngx-ode-core';
import { BundlesService } from 'ngx-ode-sijil';
import { SelectOption } from 'ngx-ode-ui';
import { Profile, Structure } from '../../../shared/services-types';

@Component({
    selector: 'ode-connector-mass-assignment',
    templateUrl: './connector-mass-assignment.component.html',
    styleUrls: ['./connector-mass-assignment.component.scss']
})
export class ConnectorMassAssignmentComponent extends OdeComponent implements OnInit {

    constructor(injector: Injector, private bundlesService: BundlesService, formBuilder: FormBuilder) {
        super(injector);
        this.massAssignmentForm = formBuilder.group({
            profiles: [[], [Validators.required]]
        });
    }
    @Input()
    public structure: Structure;
    @Input()
    public profiles: Array<Profile>;

    @Output()
    submitAssignment: EventEmitter<Array<Profile>> = new EventEmitter();
    @Output()
    submitUnassignment: EventEmitter<Array<Profile>> = new EventEmitter();

    public profileOptions: Array<SelectOption<Profile>> = [];

    public massAssignmentForm: FormGroup;
    public displayedLightbox: 'assignment' | 'unassignment' | 'none' = 'none';

    public translatedSelectedProfiles: string;
    public profileTrackByFn = (p: Profile) => p;

    ngOnInit(): void {
        super.ngOnInit();
        this.computeProfileOptions();

        this.massAssignmentForm.get('profiles').valueChanges.subscribe((profiles: Array<Profile>) => {
            this.translatedSelectedProfiles = profiles ?
                profiles.map(p => this.bundlesService.translate(p))
                    .join(', ')
                : '';
        });
    }

    private computeProfileOptions() {
        this.profileOptions = this.profiles.map(p => ({value: p, label: p}));
    }

    public assign(profiles: Array<Profile>): void {
        this.submitAssignment.emit(profiles);
    }

    public assignFromForm(form: FormGroup): void {
        const formValue = form.getRawValue() as { profiles: Array<Profile> };
        this.assign(formValue.profiles);
    }

    public unassign(profiles: Array<Profile>): void {
        this.submitUnassignment.emit(profiles);
    }

    public unassignFromForm(form: FormGroup): void {
        const formValue = form.getRawValue() as { profiles: Array<Profile> };
        this.unassign(formValue.profiles);
    }
}
