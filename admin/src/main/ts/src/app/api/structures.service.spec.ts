import { TestBed } from '@angular/core/testing';

import { StructureService } from './structures.service';

describe('StructureService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StructureService = TestBed.get(StructureService);
    expect(service).toBeTruthy();
  });
});
