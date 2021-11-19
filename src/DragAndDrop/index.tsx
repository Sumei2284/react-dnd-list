import * as React from "react";
import {
  DragDropContext,
  Draggable,
  DraggableLocation,
  DraggableProvided,
  DraggableStateSnapshot,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot,
  DropResult
} from "react-beautiful-dnd";
import { Flex } from "reflexbox";
import WidgetItem from "../Item/index";
import {
  EMBEDDABLE_TYPES,
  ICollectionWidget,
  IMasterWidget,
  IPowerBIWorkspace
} from "../interfaces";
import autobind from "autobind-decorator";
import { List, Input } from "antd";
import { DEFAULT_WIDGETS_PAGE_SIZE } from "../consts";
import Style from "./style";
import { cloneDeep, isEqual } from "lodash";

export interface Item<T> {
  id: string;
  content: T;
}

interface IDragAndDropProps<T> {
  items: T[];
  workspaces: IPowerBIWorkspace[];
  collectionWidgets: ICollectionWidget[];
  onChangeSelected(selected: Item<ICollectionWidget>[]): void;
}

interface IListsPagination {
  itemsPage: number;
  selectedPage: number;
}

enum ListsNames {
  Items = "items",
  Selected = "selected"
}

enum ListsIds {
  Droppable = "droppable",
  Droppable2 = "droppable2"
}

interface IDragAndDropState<T> {
  items: Item<T>[];
  selected: Item<ICollectionWidget>[];
  pagination: IListsPagination;
  searchInput: string;
  prevPropsItems: T[];
  prevPropsCollectionWidgets: ICollectionWidget[];
  prevSearchInput: string;
}
interface IMoveResult<T> {
  [ListsIds.Droppable]: Item<T>[];
  [ListsIds.Droppable2]: Item<T>[];
  pagination: IListsPagination;
}

const grid: number = 8;

const getItemStyle = (draggableStyle: any, isDragging: boolean) => ({
  ...draggableStyle,
  userSelect: "none",
  padding: 2 * grid,
  margin: `0 0 ${grid}px 0`,
  background: isDragging ? "lightgreen" : "transparent"
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? "lightblue" : "lightgrey",
  padding: grid,
  width: 300,
  minHeight: 600,
  overflow: "scroll" as "scroll",
  maxHeight: 600
});

function itemsAdapter<
  T extends { id: number; name?: string; embeddableType: EMBEDDABLE_TYPES }
>(
  items: T[],
  collectionWidgets: ICollectionWidget[],
  searchInput: string
): {
  filteredItems: Item<T>[];
  filteredCollectionWidgets: Item<ICollectionWidget>[];
} {
  const filteredCollectionWidgets = collectionWidgets
    .filter((w) => w.id && w.embeddableType === EMBEDDABLE_TYPES.Widget)
    .map((w) => ({ id: w.id.toString(), content: w }));
  const collectionWidgetsSet = new Set<number>(
    filteredCollectionWidgets.map((x) => Number(x.id))
  );
  const filteredItems = items
    .filter(
      (w) =>
        w.id &&
        w.embeddableType === EMBEDDABLE_TYPES.Widget &&
        !collectionWidgetsSet.has(w.id) &&
        (w.name
          ? w.name.toLowerCase().includes(searchInput.toLowerCase())
          : true)
    )
    .map((w) => ({ id: w.id.toString(), content: w }));

  return {
    filteredItems,
    filteredCollectionWidgets
  };
}

class DragAndDrop extends React.Component<
  IDragAndDropProps<IMasterWidget>,
  IDragAndDropState<IMasterWidget>
> {
  public listsIds = {
    [ListsIds.Droppable]: ListsNames.Items,
    [ListsIds.Droppable2]: ListsNames.Selected
  };

  public itemsPageSize = DEFAULT_WIDGETS_PAGE_SIZE;
  public selectedPageSize = DEFAULT_WIDGETS_PAGE_SIZE;

  public static getDerivedStateFromProps(
    props: IDragAndDropProps<IMasterWidget>,
    state: IDragAndDropState<IMasterWidget>
  ) {
    const { onChangeSelected } = props;
    const didCollectionChanged = !isEqual(
      props.collectionWidgets,
      state.prevPropsCollectionWidgets
    );
    const didItemsChanged = !isEqual(props.items, state.prevPropsItems);
    const didSearch = state.prevSearchInput !== state.searchInput;
    if (!didItemsChanged && !didCollectionChanged && !didSearch) {
      return null;
    }
    const collectionWidgets = didCollectionChanged
      ? props.collectionWidgets
      : state.selected.map((x) => ({ ...x.content }));
    const { filteredItems, filteredCollectionWidgets } = itemsAdapter(
      props.items,
      collectionWidgets,
      state.searchInput
    );
    onChangeSelected(filteredCollectionWidgets);
    return {
      prevPropsItems: props.items,
      prevPropsCollectionWidgets: props.collectionWidgets,
      prevSearchInput: state.searchInput,
      items: filteredItems,
      selected: filteredCollectionWidgets,
      pagination: {
        itemsPage: 1,
        selectedPage: didCollectionChanged ? 1 : state.pagination.selectedPage
      }
    };
  }

  constructor(props: IDragAndDropProps<IMasterWidget>) {
    super(props);

    const { filteredItems, filteredCollectionWidgets } = itemsAdapter(
      props.items,
      props.collectionWidgets,
      ""
    );

    this.state = {
      items: filteredItems,
      selected: filteredCollectionWidgets,
      pagination: {
        itemsPage: 1,
        selectedPage: 1
      },
      searchInput: "",
      prevPropsItems: props.items,
      prevPropsCollectionWidgets: props.collectionWidgets,
      prevSearchInput: ""
    };
  }

  @autobind
  private reorder({
    source,
    destination
  }: {
    source: DraggableLocation;
    destination: DraggableLocation;
  }): Item<IMasterWidget>[] {
    const list = this.getList<IMasterWidget>(source.droppableId);
    const startIndex = source.index;
    const endIndex = destination.index;

    const result = cloneDeep(list);
    const draggableShiftedIndex = this.calculateShiftedIndex(destination);
    const [removed] = result.splice(draggableShiftedIndex + startIndex, 1);
    result.splice(draggableShiftedIndex + endIndex, 0, removed);

    return result;
  }

  @autobind
  private move<T>({
    source,
    destination
  }: {
    source: DraggableLocation;
    destination: DraggableLocation;
  }): IMoveResult<T> {
    const sourceList = this.getList<IMasterWidget>(source.droppableId);
    const destinationList = this.getList<IMasterWidget>(
      destination.droppableId
    );

    const sourceClone = cloneDeep(sourceList);
    const destClone = cloneDeep(destinationList);

    const [removed] = sourceClone.splice(
      this.calculateShiftedIndex(source) + source.index,
      1
    );
    destClone.splice(
      this.calculateShiftedIndex(destination) + destination.index,
      0,
      removed
    );

    const pagination = this.calculateShiftedPagination(
      source.droppableId,
      sourceClone
    );

    const result = {
      [ListsIds.Droppable]: [],
      [ListsIds.Droppable2]: [],
      pagination
    };
    result[source.droppableId] = sourceClone;
    result[destination.droppableId] = destClone;

    return result;
  }

  @autobind
  private calculateShiftedIndex(draggableLocation: DraggableLocation): number {
    const {
      pagination: { itemsPage, selectedPage }
    } = this.state;
    return draggableLocation.droppableId === ListsIds.Droppable
      ? (itemsPage - 1) * this.itemsPageSize
      : (selectedPage - 1) * this.selectedPageSize;
  }

  @autobind
  public getList<T>(id: string): Item<T>[] {
    return this.state[this.listsIds[id]];
  }

  @autobind
  public onDragEnd(result: DropResult): void {
    const { onChangeSelected } = this.props;
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const items = this.reorder({
        source,
        destination
      });

      let state: IDragAndDropState<IMasterWidget> = { ...this.state };

      if (source.droppableId === ListsIds.Droppable2) {
        state = { ...this.state, selected: items };
      } else if (source.droppableId === ListsIds.Droppable) {
        state = { ...this.state, items };
      }

      this.setState(state, () => {
        if (source.droppableId === ListsIds.Droppable2) {
          onChangeSelected(items);
        }
      });
    } else {
      const resultFromMove: IMoveResult<IMasterWidget> = this.move({
        source,
        destination
      });

      const updatedSelected = resultFromMove[ListsIds.Droppable2];

      this.setState(
        {
          items: resultFromMove[ListsIds.Droppable],
          selected: updatedSelected,
          pagination: resultFromMove.pagination
        },
        () => {
          onChangeSelected(updatedSelected);
        }
      );
    }
  }

  @autobind
  private calculateShiftedPagination<T>(
    sourceId: string,
    sourceClone: Item<T>[]
  ): IListsPagination {
    const {
      pagination: { itemsPage, selectedPage }
    } = this.state;
    let pagination = { ...this.state.pagination };
    const sourceLength = sourceClone.length;
    if (sourceId === ListsIds.Droppable) {
      const didRemovedLastItemFromPage: boolean =
        (itemsPage - 1) * this.itemsPageSize - sourceLength === 0 &&
        sourceLength > 0;
      if (didRemovedLastItemFromPage) {
        pagination = {
          ...pagination,
          itemsPage: itemsPage - 1
        };
      }
    } else if (sourceId === ListsIds.Droppable2) {
      const didRemovedLastItemFromPage: boolean =
        (selectedPage - 1) * this.selectedPageSize - sourceLength === 0 &&
        sourceLength > 0;
      if (didRemovedLastItemFromPage) {
        pagination = {
          ...pagination,
          selectedPage: selectedPage - 1
        };
      }
    }
    return pagination;
  }

  @autobind
  private onListPagination(listId: ListsIds, page: number) {
    const { pagination } = this.state;
    const updatedPaginationState =
      listId === ListsIds.Droppable
        ? {
            itemsPage: page
          }
        : {
            selectedPage: page
          };
    this.setState({
      pagination: {
        ...pagination,
        ...updatedPaginationState
      }
    });
  }

  @autobind
  private onWidgetsSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    this.setState({ searchInput: value });
  }

  public render() {
    const {
      items,
      selected,
      pagination: { itemsPage, selectedPage },
      searchInput
    } = this.state;
    const { workspaces } = this.props;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Flex justifyContent={"space-evenly"}>
          <Flex flexDirection="column">
            <Droppable droppableId={ListsIds.Droppable}>
              {(
                provided: DroppableProvided,
                snapshot: DroppableStateSnapshot
              ) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle(snapshot.isDraggingOver)}
                >
                  <List
                    header={
                      <Input.Search
                        value={searchInput}
                        placeholder={"Search Items"}
                        onChange={this.onWidgetsSearch}
                      />
                    }
                    itemLayout="vertical"
                    size="large"
                    bordered={true}
                    split={true}
                    pagination={{
                      current: itemsPage,
                      pageSize: this.itemsPageSize,
                      onChange: this.onListPagination.bind(
                        this,
                        ListsIds.Droppable
                      ),
                      showTotal: (total: number, range: [number, number]) => {
                        return `${range[0]}-${range[1]} of ${total} items`;
                      }
                    }}
                    rowKey={(item: Item<IMasterWidget>): string => item.id}
                    dataSource={items}
                    renderItem={(item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(
                          providedDraggable: DraggableProvided,
                          snapshotDraggable: DraggableStateSnapshot
                        ) => (
                          <WidgetItem
                            innerRef={providedDraggable.innerRef}
                            widget={item.content}
                            powerbiGroups={workspaces}
                            draggableProps={providedDraggable.draggableProps}
                            dragHandleProps={providedDraggable.dragHandleProps}
                            style={getItemStyle(
                              providedDraggable.draggableProps.style,
                              snapshotDraggable.isDragging
                            )}
                          />
                        )}
                      </Draggable>
                    )}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Flex>
          <Flex flexDirection="column">
            <Droppable droppableId={ListsIds.Droppable2}>
              {(
                providedDroppable2: DroppableProvided,
                snapshotDroppable2: DroppableStateSnapshot
              ) => (
                <div
                  ref={providedDroppable2.innerRef}
                  {...providedDroppable2.droppableProps}
                  style={getListStyle(snapshotDroppable2.isDraggingOver)}
                >
                  <List
                    header={
                      <p style={Style.collectionListHeader}>Selected Items</p>
                    }
                    itemLayout="vertical"
                    size="large"
                    bordered={true}
                    split={true}
                    rowKey={(item: Item<IMasterWidget>): string => item.id}
                    pagination={{
                      current: selectedPage,
                      pageSize: this.selectedPageSize,
                      onChange: this.onListPagination.bind(
                        this,
                        ListsIds.Droppable2
                      ),
                      showTotal: (total: number, range: [number, number]) => {
                        return `${range[0]}-${range[1]} of ${total} items`;
                      }
                    }}
                    dataSource={selected}
                    renderItem={(item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(
                          providedDraggable2: DraggableProvided,
                          snapshotDraggable2: DraggableStateSnapshot
                        ) => (
                          <WidgetItem
                            innerRef={providedDraggable2.innerRef}
                            widget={item.content}
                            powerbiGroups={workspaces}
                            draggableProps={providedDraggable2.draggableProps}
                            dragHandleProps={providedDraggable2.dragHandleProps}
                            style={getItemStyle(
                              providedDraggable2.draggableProps.style,
                              snapshotDraggable2.isDragging
                            )}
                          />
                        )}
                      </Draggable>
                    )}
                  />
                  {providedDroppable2.placeholder}
                </div>
              )}
            </Droppable>
          </Flex>
        </Flex>
      </DragDropContext>
    );
  }
}

export default DragAndDrop;
