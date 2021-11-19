export enum EMBEDDABLE_TYPES {
  Widget = "widget",
  WidgetCollection = "widget_collection"
}

export interface ICollectionWidget {
  id: number;
  name?: string;
  embeddableType: EMBEDDABLE_TYPES;
  embeddableId: number;
}

export interface IPowerBIWorkspace {
  id: string;
  name: string;
  description?: string;
  type?: string;
  state?: string;
  capacityId: string;
  dataflowStorageId: string;
  isOnDedicatedCapacity: boolean;
  isReadOnly: boolean;
  users?: IPowerBIUser[];
}

export interface IPowerBIUser {
  emailAddress?: string;
  groupUserAccessRight?: GroupUserAccessRight;
}

export enum GroupUserAccessRight {
  Admin = "Admin",
  Contributor = "Contributor",
  Member = "Member",
  None = "None"
}

export enum Platform {
  All = "All",
  DataStudio = "Data Studio",
  PowerBI = "Power BI"
}

export interface IMasterWidget {
  id: number;
  name?: string;
  imageUrl?: string;
  description?: string;
  color?: string;
  title?: string;
  subtitle?: string;
  embeddableType: EMBEDDABLE_TYPES;
  embeddableId: number;
}
