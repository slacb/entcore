import { TestBed } from '@angular/core/testing';

import { GroupDetailsService } from './group-details.service';

describe('GroupDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GroupDetailsService = TestBed.get(GroupDetailsService);
    expect(service).toBeTruthy();
  });
});
