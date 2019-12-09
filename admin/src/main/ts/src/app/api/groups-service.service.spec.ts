import { TestBed } from '@angular/core/testing';

import { GroupsServiceService } from './groups-service.service';

describe('GroupsServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GroupsServiceService = TestBed.get(GroupsServiceService);
    expect(service).toBeTruthy();
  });
});
