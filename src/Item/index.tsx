import { List, Avatar, Button, Tag, Icon } from "antd";
import * as React from "react";
import { EMBEDDABLE_TYPES, IPowerBIWorkspace, Platform } from "../interfaces";
import Style from "./style";
import { compact } from "lodash";
import { CSSProperties } from "react";
import {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps
} from "react-beautiful-dnd";

export interface IWidgetCatalogItem {
  id: number;
  name?: string;
  imageUrl?: string;
  color?: string;
  workspaceId?: string;
  labels?: string;
  platform?: Platform;
  embeddableId: number;
  embeddableType: EMBEDDABLE_TYPES;
}
export interface IMasterWidgetCatalogItemProps {
  widget: IWidgetCatalogItem | undefined;
  powerbiGroups: IPowerBIWorkspace[];
  onEdit?: (widget: IWidgetCatalogItem | undefined) => any;
  onClick?: (widget: IWidgetCatalogItem | undefined) => any;
  onDelete?: (widget: IWidgetCatalogItem | undefined) => any;
  innerRef?: any;
  style?: CSSProperties;
  draggableProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

export default function WidgetItem(props: IMasterWidgetCatalogItemProps) {
  const {
    widget,
    onEdit,
    onClick,
    onDelete,
    powerbiGroups,
    innerRef,
    style,
    draggableProps,
    dragHandleProps
  } = props;

  if (!widget) {
    return null;
  }
  const tags = widget?.labels
    ?.split(",")
    .map((label, index) => <Tag key={index}>{label}</Tag>);
  const selectedWorkspace = powerbiGroups.find(
    (g) => g.id.toUpperCase() === widget.workspaceId?.toUpperCase()
  );
  const collectionChildrenNames = (widget.widgets || []).map(
    (x) => ` ${x.name}` || " name not found"
  );

  return (
    <div style={style} ref={innerRef} {...draggableProps} {...dragHandleProps}>
      <List.Item
        style={style?.background ? { background: style.background } : {}}
        key={widget.id}
        onClick={() => onClick && onClick(widget)}
        actions={compact([
          onEdit && (
            <Button shape="circle" icon="edit" onClick={() => onEdit(widget)} />
          )
        ])}
        extra={
          <img
            width={Style.widgetImageWidth}
            alt="latest"
            src={widget.imageUrl}
          />
        }
      >
        <List.Item.Meta
          avatar={
            <Avatar
              style={Style.avatarStyle(widget.color)}
              icon="bar-chart"
              shape="square"
              size="large"
            />
          }
          title={widget.name}
          description={
            widget.embeddableType === EMBEDDABLE_TYPES.Widget
              ? `${widget.platform || ""}${
                  selectedWorkspace
                    ? ` | workspace ${selectedWorkspace.name}`
                    : ""
                }`
              : widget.embeddableType === EMBEDDABLE_TYPES.WidgetCollection
              ? `${
                  collectionChildrenNames.length
                    ? `Collection of:${collectionChildrenNames}`
                    : "Empty Collection"
                }`
              : "Unrecognized widget type"
          }
        />
        {onDelete && (
          <Icon
            type="delete"
            style={Style.deleteIcon}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete && onDelete(widget);
            }}
          />
        )}
        <div>{tags}</div>
      </List.Item>
    </div>
  );
}
