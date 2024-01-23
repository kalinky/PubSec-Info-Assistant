// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useCallback, useState } from "react";
import { DetailsList, DetailsListLayoutMode, SelectionMode, IColumn, Selection, Label, BaseSelectedItemsList, Link, DialogContent } from "@fluentui/react";
import { Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogActions, Button } from '@fluentui/react-components';
import { TooltipHost, IconButton } from '@fluentui/react';

import styles from "./DocumentsDetailList.module.css";
import { BlobServiceClient } from "@azure/storage-blob";
import { getBlobClientUrl, deleteDocument, pushToEmbeddingsQueue } from "../../api";

export interface IDocument {
    key: string;
    name: string;
    value: string;
    iconName: string;
    fileType: string;
    state: string;
    state_description: string;
    upload_timestamp: string;
    modified_timestamp: string;
}

interface Props {
    items: IDocument[];
    onFilesSorted?: (items: IDocument[]) => void;
}

export const DocumentsDetailList = ({ items, onFilesSorted }: Props) => {

    const onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
        const newColumns: IColumn[] = columns.slice();
        const currColumn: IColumn = newColumns.filter(currCol => column.key === currCol.key)[0];
        newColumns.forEach((newCol: IColumn) => {
            if (newCol === currColumn) {
                currColumn.isSortedDescending = !currColumn.isSortedDescending;
                currColumn.isSorted = true;
            } else {
                newCol.isSorted = false;
                newCol.isSortedDescending = true;
            }
        });
        const newItems = copyAndSort(items, currColumn.fieldName!, currColumn.isSortedDescending);
        items = newItems as IDocument[];
        setColumns(newColumns);
        onFilesSorted == undefined ? console.log("onFileSorted event undefined") : onFilesSorted(items);
    };

    function copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
        const key = columnKey as keyof T;
        return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
    }

    function getKey(item: any, index?: number): string {
        return item.key;
    }

    function onItemInvoked(item: any): void {
        // TODO: show dialog to confirm file delete
        setSelectedItem(item);
        console.log(`Item invoked: ${item.name}`);
    }

    const [selectedItem, setSelectedItem] = useState<IDocument | null>(null);
    const [open, setOpen] = useState(false);

    function onDeleteConfirmed(item: any): void {
        // Delete the file here
        console.log(`Deleting item ${item.name}: `, item);
        handleDeleteFile(item);
    }

    function onReindexRequested(item: any): void {
        // Create an item in the embeddings queue
        console.log(`Creating embeddings queue item for ${item.name}: `, item);
        handlePushToEmbeddingsQueue(item);
    }

    const handleDeleteFile = useCallback(async (item: any) => {
        const result = await deleteDocument(item);

        if (result.status === "200") {
            //TODO: remove item from list
            console.log("item should be removed", result);
            // items.remove(item);
            //TODO: refresh list
        }

        return result;
    }, []);

    const handlePushToEmbeddingsQueue = useCallback(async (item: any) => {
        const result = await pushToEmbeddingsQueue(item);

        return result;
    }, []);

    const [columns, setColumns] = useState<IColumn[]>([
        {
            key: 'column1',
            name: 'File Type',
            className: styles.fileIconCell,
            iconClassName: styles.fileIconHeaderIcon,
            ariaLabel: 'Column operations for File type, Press to sort on File type',
            iconName: 'Page',
            isIconOnly: true,
            fieldName: 'name',
            minWidth: 16,
            maxWidth: 16,
            onColumnClick: onColumnClick,
            onRender: (item: IDocument) => (
                <TooltipHost content={`${item.fileType} file`}>
                    <img src={"https://res-1.cdn.office.net/files/fabric-cdn-prod_20221209.001/assets/item-types/16/" + item.iconName + ".svg"} className={styles.fileIconImg} alt={`${item.fileType} file icon`} />
                </TooltipHost>
            ),
        },
        {
            key: 'column2',
            name: 'Name',
            fieldName: 'name',
            minWidth: 210,
            maxWidth: 350,
            isRowHeader: true,
            isResizable: true,
            sortAscendingAriaLabel: 'Sorted A to Z',
            sortDescendingAriaLabel: 'Sorted Z to A',
            onColumnClick: onColumnClick,
            data: 'string',
            isPadded: true,
        },
        {
            key: 'column3',
            name: 'State',
            fieldName: 'state',
            minWidth: 70,
            maxWidth: 90,
            isResizable: true,
            ariaLabel: 'Column operations for state, Press to sort by states',
            onColumnClick: onColumnClick,
            data: 'string',
            onRender: (item: IDocument) => (
                <TooltipHost content={`${item.state_description} `}>
                    <span>{item.state}</span>
                </TooltipHost>
            ),
            isPadded: true,
        },
        {
            key: 'column4',
            name: 'Submitted On',
            fieldName: 'upload_timestamp',
            minWidth: 70,
            maxWidth: 90,
            isResizable: true,
            isCollapsible: true,
            ariaLabel: 'Column operations for submitted on date, Press to sort by submitted date',
            data: 'string',
            onColumnClick: onColumnClick,
            onRender: (item: IDocument) => {
                return <span>{item.upload_timestamp}</span>;
            },
            isPadded: true,
        },
        {
            key: 'column5',
            name: 'Last Updated',
            fieldName: 'modified_timestamp',
            minWidth: 70,
            maxWidth: 90,
            isResizable: true,
            isSorted: true,
            isSortedDescending: false,
            sortAscendingAriaLabel: 'Sorted Oldest to Newest',
            sortDescendingAriaLabel: 'Sorted Newest to Oldest',
            isCollapsible: true,
            ariaLabel: 'Column operations for last updated on date, Press to sort by last updated date',
            data: 'number',
            onColumnClick: onColumnClick,
            onRender: (item: IDocument) => {
                return <span>{item.modified_timestamp}</span>;
            },
        },
        {
            key: 'column6',
            name: 'Actions',
            fieldName: 'Actions',
            minWidth: 16,
            maxWidth: 16,
            // isIconOnly: true,
            ariaLabel: 'Column operations for delete or edit actions',
            onColumnClick: onColumnClick,
            onRender: (item: IDocument) => {
                return <>
                    <IconButton
                        style={{ color: "black" }}
                        iconProps={{ iconName: "Delete" }}
                        title="Delete"
                        ariaLabel="Delete"
                        onClick={() => {
                            // console.log('clicked', item);
                            // setOpen(true); 
                            onDeleteConfirmed(item);
                        }}
                    />
                    <IconButton
                        style={{ color: "black" }}
                        iconProps={{ iconName: "Insert" }}
                        title="Reindex"
                        ariaLabel="Reindex"
                        onClick={() => {
                            // console.log('clicked', item);
                            // setOpen(true); 
                            onReindexRequested(item);
                        }}
                    />
                </>
            },
        }
    ]);

    return (
        <div>
            <span className={styles.footer}>{"(" + items.length as string + ") records."}</span>
            <DetailsList
                items={items}
                compact={true}
                columns={columns}
                selectionMode={SelectionMode.none}
                getKey={getKey}
                setKey="none"
                layoutMode={DetailsListLayoutMode.justified}
                isHeaderVisible={true}
                onItemInvoked={onItemInvoked}
            />
            <span className={styles.footer}>{"(" + items.length as string + ") records."}</span>
            {/* <Dialog
                open={open}
                onOpenChange={(event, data) => {
                    // it is the users responsibility to react accordingly to the open state change
                    setOpen(data.open);
                }}
                // dialogContentProps={{
                //     type: DialogType.normal,
                //     title: 'Confirm Delete',
                //     subText: `Are you sure you want to delete ${selectedItem?.name}?`,
                // }}
                // modalProps={{
                //     isBlocking: true,
                //     styles: { main: { maxWidth: 450 } },
                // }}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogContent>
                            Are you sure you want to delete xxx?
                        </DialogContent>
                    </DialogBody>
                </DialogSurface>
                <DialogActions>
                    <Button appearance="primary" onClick={() => alert("todo: not yet implemented, file to be deleted")}>Delete</Button>
                    <Button appearance="secondary">Cancel</Button>
                </DialogActions>
            </Dialog> */}

        </div>
    );
}