import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Node: dom.window.Node,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window)
});

await import('@angular/compiler');
const { PLATFORM_ID, provideZonelessChangeDetection } = await import('@angular/core');
const { TestBed } = await import('@angular/core/testing');
const { BrowserTestingModule, platformBrowserTesting } = await import('@angular/platform-browser/testing');
const { RapidGridComponent, CellRange } = await import('../dist/fesm2022/rapid-grid-angular.mjs');

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

test('Angular component mounts, updates inputs, forwards events, rebuilds and destroys the core grid', () => {
  TestBed.configureTestingModule({
    imports: [RapidGridComponent],
    providers: [provideZonelessChangeDetection()]
  });
  const fixture = TestBed.createComponent(RapidGridComponent);
  const firstItems = [{ name: 'First' }];
  const nextItems = [{ name: 'Next' }, { name: 'Last' }];
  const columns = [{ binding: 'name' }];
  const seen = [];
  const ready = [];
  fixture.componentInstance.selectionChanged.subscribe(event => seen.push(event));
  fixture.componentInstance.gridReady.subscribe(grid => ready.push(grid));
  fixture.componentRef.setInput('items', firstItems);
  fixture.componentRef.setInput('columns', columns);
  fixture.detectChanges();

  const firstGrid = fixture.componentInstance.grid;
  assert.ok(firstGrid);
  assert.deepEqual(ready, [firstGrid]);
  assert.equal(firstGrid.collectionView.items, firstItems);
  assert.equal(fixture.nativeElement.querySelectorAll('.ig-root').length, 1);
  firstGrid.select(new CellRange(0, 0));
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0].ranges[0], new CellRange(0, 0));
  const cancel = fixture.componentInstance.selectionChanging.subscribe(event => { event.cancel = true; });
  assert.equal(firstGrid.select(new CellRange(0, 0)), false);
  assert.equal(seen.length, 1);
  cancel.unsubscribe();

  fixture.componentRef.setInput('items', nextItems);
  fixture.detectChanges();
  assert.equal(fixture.componentInstance.grid, firstGrid);
  assert.equal(firstGrid.collectionView.items, nextItems);
  assert.equal(firstGrid.rows.length, 2);

  fixture.componentRef.setInput('columns', [{ binding: 'name', width: 220 }]);
  fixture.detectChanges();
  assert.notEqual(fixture.componentInstance.grid, firstGrid);
  assert.equal(fixture.componentInstance.grid.columns.get(0).width, 220);
  assert.deepEqual(ready, [firstGrid, fixture.componentInstance.grid]);
  assert.equal(fixture.nativeElement.querySelectorAll('.ig-root').length, 1);

  fixture.destroy();
  assert.equal(fixture.componentInstance.grid, null);
  assert.equal(fixture.nativeElement.querySelectorAll('.ig-root').length, 0);
  TestBed.resetTestingModule();
});

test('Angular component rebuilds inferred columns when the first item fields change', () => {
  TestBed.configureTestingModule({
    imports: [RapidGridComponent],
    providers: [provideZonelessChangeDetection()]
  });
  const fixture = TestBed.createComponent(RapidGridComponent);
  fixture.componentRef.setInput('items', [{ name: 'First' }]);
  fixture.detectChanges();
  const firstGrid = fixture.componentInstance.grid;
  assert.equal(firstGrid.columns.length, 1);

  fixture.componentRef.setInput('items', [{ name: 'Next', price: 10 }]);
  fixture.detectChanges();
  assert.notEqual(fixture.componentInstance.grid, firstGrid);
  assert.equal(fixture.componentInstance.grid.columns.length, 2);
  fixture.destroy();
  TestBed.resetTestingModule();
});

test('Angular component does not create a DOM grid during server rendering', () => {
  TestBed.configureTestingModule({
    imports: [RapidGridComponent],
    providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: 'server' }]
  });
  const fixture = TestBed.createComponent(RapidGridComponent);
  fixture.detectChanges();
  assert.equal(fixture.componentInstance.grid, null);
  fixture.destroy();
  TestBed.resetTestingModule();
});
