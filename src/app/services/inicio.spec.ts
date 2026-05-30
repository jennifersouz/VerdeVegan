import { TestBed } from '@angular/core/testing';

import { Inicio } from './inicio';

describe('Inicio', () => {
  let service: Inicio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Inicio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
