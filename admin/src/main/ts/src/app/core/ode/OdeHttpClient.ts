import { Logger } from 'ngx-ode-core';
import { HttpClient, HttpHeaders, HttpParams, HttpHandler } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { tap } from 'rxjs/operators';

export interface IRequestOptions {
    headers?: HttpHeaders;
    observe?: 'body';
    params?: HttpParams;
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
    body?: any;
}



@Injectable()
export class OdeHttpClient extends HttpClient {

    private api = '';

    constructor(handler: HttpHandler, private logger: Logger) {
        super(handler);
    }

    public Get<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
        return this.get<T>(this.api + endPoint, options)
        .pipe(
            tap((response: any) => {
                this.logger.debug(`[HTTP] [GET] ${endPoint}`, this, options);
                this.logger.debug(`------ [RESPONSE]`, this, response);
            })
        );
    }

    public Post<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
        return this.post<T>(this.api + endPoint, params, options);
    }

    public Put<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
        return this.put<T>(this.api + endPoint, params, options);
    }

    public Delete<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
        return this.delete<T>(this.api + endPoint, options);
    }
}