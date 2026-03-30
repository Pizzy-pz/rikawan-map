"use client";

import Link from "next/link";
import { Store } from "@/types/store";

type Props = {
  stores: Store[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
};

export default function StoreList({ stores, selectable, selectedIds, onToggleSelect }: Props) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-lg font-medium">店舗が登録されていません</p>
        <p className="text-sm mt-1">右上の「新規登録」から店舗を追加してください</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {stores.map((store) => {
        const isSelected = selectedIds?.has(store.id) ?? false;

        if (selectable) {
          return (
            <li key={store.id}>
              <button
                onClick={() => onToggleSelect?.(store.id)}
                className={`w-full text-left border rounded-lg p-4 transition flex items-center gap-3 ${
                  isSelected
                    ? "bg-red-50 border-red-300"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-red-500 bg-red-500" : "border-gray-300"
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                  {store.memo && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.memo}</p>
                  )}
                </div>
              </button>
            </li>
          );
        }

        return (
          <li key={store.id}>
            <Link
              href={`/stores/${store.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                  {store.memo && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.memo}</p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
