import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxOdeSijilModule } from 'ngx-ode-sijil';
import { LabelsService, NgxOdeUiModule, SpinnerService } from 'ngx-ode-ui';
import { throwIfAlreadyLoaded } from './module-import.guard';
import { NavComponent } from './nav/nav.component';
import { ConfigResolver } from './resolvers/config.resolver';
import { I18nResolver } from './resolvers/i18n.resolver';
import { SessionResolver } from './resolvers/session.resolver';
import { StructuresResolver } from './resolvers/structures.resolver';
import { NotifyService } from './services/notify.service';
import { SijilLabelsService } from './services/sijil.labels.service';
import { SessionService } from './../api/session.service';
import { StructuresService } from '../api/structures.service';
import { Logger } from 'ngx-ode-core';
import { OdeHttpClient } from './ode/OdeHttpClient';
import { HttpHandler } from '@angular/common/http';

export function applicationHttpClientCreator(httpHandler: HttpHandler, logger: Logger) {
    return new OdeHttpClient(httpHandler, logger);
  }
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgxOdeSijilModule.forRoot(),
        NgxOdeUiModule.forRoot({
            provide: LabelsService,
            useExisting: SijilLabelsService
        }),
        RouterModule
    ],
    exports: [NavComponent],
    declarations: [NavComponent],
    providers: [
        SessionResolver,
        StructuresResolver,
        I18nResolver,
        SijilLabelsService,
        NotifyService,
        SpinnerService,
        ConfigResolver,
        Logger,
        StructuresService,
        SessionService,
        {
            provide: OdeHttpClient,
            useFactory: applicationHttpClientCreator,
            deps: [HttpHandler, Logger]
        }
    ],
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        throwIfAlreadyLoaded(parentModule, 'CoreModule');
    }
}
