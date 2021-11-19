import React, { useState, useEffect } from "react";
import DragAndDrop, { Item } from "../DragAndDrop/index";
import { IMasterWidget, EMBEDDABLE_TYPES } from "../interfaces";
import { ICollectionWidget } from "../interfaces";

const initialSelectedItems: ICollectionWidget[] = [];

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default function App() {
  const [initialItems, setInitialItems] = useState<IMasterWidget[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item<ICollectionWidget>[]>(
    []
  );
  useEffect(() => {
    fetch(`https://picsum.photos/v2/list?&limit=500`, {
      method: "GET"
    })
      .then((res) => res.json())
      .then((response) => {
        const randomImagesAsItems = response.map((x: any) => ({
          id: Number(x.id),
          name: x.author || "N/A",
          imageUrl: x.download_url,
          color: getRandomColor(),
          embeddableType: EMBEDDABLE_TYPES.Widget,
          embeddableId: Number(x.id)
        }));
        setInitialItems(randomImagesAsItems);
      })
      .catch((error) => console.log(error));
  }, []);

  const onChangeSelected = (selected: Item<ICollectionWidget>[]) => {
    setSelectedItems(selected);
    console.log(selected);
  };

  return (
    <div>
      <DragAndDrop
        collectionWidgets={initialSelectedItems}
        items={initialItems}
        workspaces={[]}
        onChangeSelected={onChangeSelected}
      />
    </div>
  );
}
