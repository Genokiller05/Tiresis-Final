import { TestBed } from '@angular/core/testing';

import { JsonStorage } from './json-storage';

describe('JsonStorage', () => {
  let service: JsonStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
