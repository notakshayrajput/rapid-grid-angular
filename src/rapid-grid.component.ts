import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, NgZone,
  OnChanges, OnDestroy, Output, PLATFORM_ID, SimpleChanges
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RapidGrid as CoreRapidGrid } from 'rapid-grid';
import type {
  CellEditEventArgs, CellRangeEventArgs, ColumnOptions, DataItem, DragEventArgs,
  FormatItemEventArgs, GridOptions
} from 'rapid-grid';

/** Angular host for the rapid-grid DOM engine. */
@Component({
  selector: 'rapid-grid',
  standalone: true,
  template: '',
  styles: [':host { display: block; width: 100%; height: 400px; }']
})
export class RapidGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() items: DataItem[] = [];
  @Input() columns?: ColumnOptions[];
  @Input() rowHeight?: GridOptions['rowHeight'];
  @Input() columnWidth?: GridOptions['columnWidth'];
  @Input() rowHeaderWidth?: GridOptions['rowHeaderWidth'];
  @Input() columnHeaderHeight?: GridOptions['columnHeaderHeight'];
  @Input() overscanRows?: GridOptions['overscanRows'];
  @Input() overscanColumns?: GridOptions['overscanColumns'];
  @Input() fastScrollThreshold?: GridOptions['fastScrollThreshold'];
  @Input() allowMerging?: GridOptions['allowMerging'];
  @Input() allowDragging?: GridOptions['allowDragging'];
  @Input() selectionMode?: GridOptions['selectionMode'];
  @Input() autoSizeRows?: GridOptions['autoSizeRows'];
  @Input() locale?: GridOptions['locale'];

  @Output() readonly gridReady = new EventEmitter<CoreRapidGrid>();
  @Output() readonly formatItem = new EventEmitter<FormatItemEventArgs>();
  @Output() readonly cellRecycling = new EventEmitter<FormatItemEventArgs>();
  @Output() readonly beginningEdit = new EventEmitter<CellEditEventArgs>();
  @Output() readonly cellEditEnding = new EventEmitter<CellEditEventArgs>();
  @Output() readonly cellEditEnded = new EventEmitter<CellEditEventArgs>();
  @Output() readonly selectionChanging = new EventEmitter<CellRangeEventArgs>();
  @Output() readonly selectionChanged = new EventEmitter<CellRangeEventArgs>();
  @Output() readonly draggedRow = new EventEmitter<DragEventArgs>();
  @Output() readonly draggedColumn = new EventEmitter<DragEventArgs>();

  /** The underlying grid instance, available after the view initializes. */
  grid: CoreRapidGrid | null = null;

  private unsubscribe: Array<() => void> = [];
  private inferredColumns = '';

  constructor(
    private readonly element: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) this.createGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.grid) return;
    const constructionChanged = Object.keys(changes).some(key => key !== 'items');
    const fieldsChanged = !this.columns && this.getInferredColumns() !== this.inferredColumns;
    if (constructionChanged || fieldsChanged) {
      this.disposeGrid();
      this.createGrid();
    } else if (changes['items']) {
      this.grid.collectionView.setItems(this.items ?? []);
    }
  }

  ngOnDestroy(): void {
    this.disposeGrid();
  }

  private getInferredColumns(): string {
    return Object.keys(this.items?.[0] ?? {}).join('\u0000');
  }

  private createGrid(): void {
    this.inferredColumns = this.getInferredColumns();
    this.zone.runOutsideAngular(() => {
      const grid = new CoreRapidGrid(this.element.nativeElement, {
        items: this.items ?? [], columns: this.columns, rowHeight: this.rowHeight,
        columnWidth: this.columnWidth, rowHeaderWidth: this.rowHeaderWidth,
        columnHeaderHeight: this.columnHeaderHeight, overscanRows: this.overscanRows,
        overscanColumns: this.overscanColumns, fastScrollThreshold: this.fastScrollThreshold,
        allowMerging: this.allowMerging, allowDragging: this.allowDragging,
        selectionMode: this.selectionMode, autoSizeRows: this.autoSizeRows, locale: this.locale
      });
      this.grid = grid;
      const emit = <T>(output: EventEmitter<T>, args: T): void => {
        if (output.observers.length) this.zone.run(() => output.emit(args));
      };
      this.unsubscribe = [
        grid.onFormatItem((_, args) => emit(this.formatItem, args)),
        grid.onCellRecycling((_, args) => emit(this.cellRecycling, args)),
        grid.onBeginningEdit((_, args) => emit(this.beginningEdit, args)),
        grid.onCellEditEnding((_, args) => emit(this.cellEditEnding, args)),
        grid.onCellEditEnded((_, args) => emit(this.cellEditEnded, args)),
        grid.onSelectionChanging((_, args) => emit(this.selectionChanging, args)),
        grid.onSelectionChanged((_, args) => emit(this.selectionChanged, args)),
        grid.onDraggedRow((_, args) => emit(this.draggedRow, args)),
        grid.onDraggedColumn((_, args) => emit(this.draggedColumn, args))
      ];
      // The core renders during construction, before handlers can be registered.
      grid.refresh(true);
      emit(this.gridReady, grid);
    });
  }

  private disposeGrid(): void {
    if (!this.grid) return;
    this.unsubscribe.forEach(remove => remove());
    this.unsubscribe = [];
    this.grid.destroy();
    this.grid = null;
  }
}
