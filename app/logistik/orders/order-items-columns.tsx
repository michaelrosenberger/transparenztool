"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export type OrderItem = {
  vegetable: string;
  quantity: number;
};

export const columns: ColumnDef<OrderItem>[] = [
  {
    accessorKey: "vegetable",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent px-0"
        >
          Zutat
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3 px-3">
          <span className="text-base">{row.getValue("vegetable")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Menge
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      return (
        <div className="text-right">
          <span className="text-base">{quantity}</span>
          <span className="ml-1">kg</span>
        </div>
      );
    },
  },
];
