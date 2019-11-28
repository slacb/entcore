import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BundlesService} from 'sijil';


@Component({
    selector: 'ode-pager',
    templateUrl: './pager.component.html',
    styles: [`
        i {cursor: pointer; padding: 0 2px;}
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagerComponent implements OnInit {
    constructor(
        private bundles: BundlesService,
        private cdRef: ChangeDetectorRef)  {}

    @Input() limit: number;

    @Input() offset: number;
    @Output() offsetChange = new EventEmitter<number>();

    @Input() total: number;

    translate = (...args) => (this.bundles.translate as any)(...args);

    ngOnInit() {}

    previousPage(): void {
        if (this.offset - this.limit >= 0) {
            this.offset = this.offset - this.limit;
        } else {
            this.offset = 0;
        }
        this.offsetChange.emit(this.offset);
    }

    nextPage(): void {
        if (this.offset + this.limit <= this.total) {
            this.offset = this.offset + this.limit;
        }
        this.offsetChange.emit(this.offset);
    }

    offsetLimit(): number {
        return this.offset + this.limit < this.total ?
            this.offset + this.limit : this.total;
    }
}