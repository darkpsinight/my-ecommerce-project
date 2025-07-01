"use client";
import React, { useState, useEffect } from "react";
import { ExpirationGroup } from "@/services/product";
import QuantityControl from "../Cart/QuantityControl";

interface ExpirationGroupSelection {
  type: "never_expires" | "expires";
  count: number;
  date?: string;
}

interface ExpirationGroupSelectorProps {
  expirationGroups: ExpirationGroup[];
  onSelectionChange: (selections: ExpirationGroupSelection[]) => void;
  disabled?: boolean;
  maxTotalQuantity?: number;
}

const ExpirationGroupSelector: React.FC<ExpirationGroupSelectorProps> = ({
  expirationGroups,
  onSelectionChange,
  disabled = false,
  maxTotalQuantity = 10
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [groupSelections, setGroupSelections] = useState<ExpirationGroupSelection[]>([]);

  // Initialize group selections
  useEffect(() => {
    const initialSelections = expirationGroups.map(group => ({
      type: group.type,
      count: 0,
      date: group.date
    }));
    setGroupSelections(initialSelections);
  }, [expirationGroups]);

  // Notify parent of changes
  useEffect(() => {
    const activeSelections = groupSelections.filter(selection => selection.count > 0);
    onSelectionChange(activeSelections);
  }, [groupSelections, onSelectionChange]);

  const updateGroupCount = (groupIndex: number, newCount: number) => {
    setGroupSelections(prev => 
      prev.map((selection, index) => 
        index === groupIndex 
          ? { ...selection, count: newCount }
          : selection
      )
    );
  };

  const getTotalSelected = () => {
    return groupSelections.reduce((total, selection) => total + selection.count, 0);
  };

  const getMaxQuantityForGroup = (groupIndex: number) => {
    const group = expirationGroups[groupIndex];
    const currentTotal = getTotalSelected();
    const currentGroupCount = groupSelections[groupIndex]?.count || 0;
    const remainingCapacity = maxTotalQuantity - (currentTotal - currentGroupCount);
    
    return Math.min(group.quantity, remainingCapacity);
  };

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGroupDisplayName = (group: ExpirationGroup) => {
    if (group.type === "never_expires") {
      return "Never expires";
    } else {
      return `Expires ${group.date ? formatExpirationDate(group.date) : "soon"}`;
    }
  };

  const getGroupIcon = (group: ExpirationGroup) => {
    if (group.type === "never_expires") {
      return (
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-5 h-5 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  // Don't render if only one group exists or if there are no groups
  if (!expirationGroups || expirationGroups.length <= 1) {
    return null;
  }

  // Don't render if disabled and no selections made
  if (disabled && getTotalSelected() === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <svg
            className="animate-spin h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-500">Loading expiration options...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="font-semibold text-gray-900">
              Choose Expiration Types
            </span>
          </div>
          {getTotalSelected() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {getTotalSelected()} selected
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Select the quantity for each expiration type. Different types may have different expiration dates.
            </div>

            {expirationGroups.map((group, index) => {
              const selection = groupSelections[index];
              const maxForGroup = getMaxQuantityForGroup(index);
              
              return (
                <div
                  key={`${group.type}-${group.date || 'no-date'}`}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selection?.count > 0
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getGroupIcon(group)}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getGroupDisplayName(group)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {group.quantity} available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <QuantityControl
                        quantity={selection?.count || 0}
                        onIncrease={() => {
                          const currentCount = selection?.count || 0;
                          if (currentCount < maxForGroup) {
                            updateGroupCount(index, currentCount + 1);
                          }
                        }}
                        onDecrease={() => {
                          const currentCount = selection?.count || 0;
                          if (currentCount > 0) {
                            updateGroupCount(index, currentCount - 1);
                          }
                        }}
                        min={0}
                        max={maxForGroup}
                        disabled={disabled || maxForGroup === 0}
                        handleQuantityChange={(newQuantity) => {
                          updateGroupCount(index, Math.min(Math.max(newQuantity, 0), maxForGroup));
                        }}
                        showMaximumPulse={false}
                      />
                    </div>
                  </div>
                  
                  {group.type === "expires" && group.date && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        These codes will expire on {formatExpirationDate(group.date)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total selected:</span>
                <span className="font-semibold text-gray-900">
                  {getTotalSelected()} of {maxTotalQuantity} max
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpirationGroupSelector;