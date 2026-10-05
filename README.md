# rapid-grid-angular

An Angular component for [`rapid-grid`](https://www.npmjs.com/package/rapid-grid). This package uses the core grid engine and manages its Angular lifecycle.

## Install

```sh
npm install rapid-grid-angular
```

The package installs `rapid-grid` as a dependency and uses the Angular version from your app. Add the grid stylesheet to your app's global styles (or the `styles` array in `angular.json`):

```css
@import 'rapid-grid-angular/style.css';
```

## Use

```ts
import { Component } from '@angular/core';
import {
  DataType, RapidGridComponent, type ColumnOptions, type DataItem,
  type CellRangeEventArgs
} from 'rapid-grid-angular';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RapidGridComponent],
  template: `
    <rapid-grid
      [items]="items"
      [columns]="columns"
      [style.height.px]="500"
      (selectionChanged)="onSelectionChanged($event)"
    />
  `
})
export class ProductsComponent {
  items: DataItem[] = [
    { id: 1, name: 'Notebook', price: 12.5 },
    { id: 2, name: 'Pen', price: 2.5 }
  ];

  columns: ColumnOptions[] = [
    { binding: 'id', width: 80, dataType: DataType.Number },
    { binding: 'name', width: 180 },
    { binding: 'price', width: 120, dataType: DataType.Number, format: 'c2' }
  ];

  onSelectionChanged(event: CellRangeEventArgs): void {
    console.log(event.ranges);
  }
}
```

The component host is 400 px high by default. Set its height to fit your layout. Its public `grid` property contains the underlying `rapid-grid` instance after initialization; the `gridReady` output emits that instance. The component creates the grid only in the browser, so it can be rendered during server-side rendering.

Replacing `items` updates the existing grid. Changing `columns` or another construction input recreates the grid because the core grid sets those options in its constructor. If `columns` is omitted, changing the fields of the first item also recreates the grid. For in-place item value mutations, call `grid?.refresh(true)` through a component reference. Grid editing mutates the supplied item objects, as in the core package.

Core grid events are Angular outputs: `formatItem`, `cellRecycling`, `beginningEdit`, `cellEditEnding`, `cellEditEnded`, `selectionChanging`, `selectionChanged`, `draggedRow`, and `draggedColumn`. Each output emits the core event args; the grid instance is available through `grid`. Set `$event.cancel = true` in a synchronous `beginningEdit`, `cellEditEnding`, or `selectionChanging` handler to cancel that action. `gridReady` emits the grid instance. The component also exports core enums, `CellRange`, and types; the core class is named `RapidGridCore` in this package.

## Development

```sh
npm install
npm test
```

`npm run build` writes the publishable Angular package to `dist/`. The build uses Angular's partial compilation format.
