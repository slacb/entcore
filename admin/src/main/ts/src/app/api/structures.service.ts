import { ConnectorCollection } from './../core/store/collections/connector.collection';
import { ApplicationCollection } from './../core/store/collections/application.collection';
import { GroupCollection } from './../core/store/collections/group.collection';
import { globalStore } from './../core/store/global.store';
import { StructureModel } from '../core/store/models/structure.model';
import { HttpClient } from '@angular/common/http';
import { OdeHttpClient } from '../core/ode/OdeHttpClient';
import { Injectable } from '@angular/core';
import { tap, map } from 'rxjs/operators';
import {Observable} from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class StructuresService {

  constructor(public httpClient: OdeHttpClient) { }


  get(): Observable<StructureModel[]> {
    return this.httpClient.Get<StructureModel[]>('/directory/structure/admin/list')
    .pipe(
      map((structures: StructureModel[]) => {
        const structs = [];
        for (const structure of structures) {
          structs.push(Object.assign(new StructureModel(), structure));
        }
        globalStore.structures.data = structs;
        
        return this.asTree(structs);
      }
    ));
  }

  private asTree(data: Array<any>) {
      const childrenMap = new Map<string, StructureModel[]>();
      const referenceSet = new Set<string>(data.map((structure: StructureModel) => structure.id));
      data.forEach((structure: StructureModel) => {
            structure.parents && structure.parents.forEach(parent => {
                  childrenMap.has(parent.id) ? childrenMap.get(parent.id).push(structure) :childrenMap.set(parent.id, [structure]);
            });
      });
      data.forEach((structure: StructureModel) => {
          if (childrenMap.has(structure.id)) {
              structure.children = childrenMap.get(structure.id);
          }
      });
      const result = data.filter((structure: StructureModel) => {
          return !structure.parents ||
                  structure.parents.length <= 1 ||
                  structure.parents.every(p => !referenceSet.has(p.id));
      });
      return result;
  }

}
