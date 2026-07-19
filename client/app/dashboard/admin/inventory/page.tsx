import BloodInventoryTable from "@/components/dashboard/admin/BloodInventoryTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blood Inventory | BloodLink Admin",
  description: "Manage blood stock levels for your blood bank.",
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Blood Inventory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track and update your blood bank&apos;s stock levels for all blood groups.
        </p>
      </div>
      <BloodInventoryTable />
    </div>
  );
}
