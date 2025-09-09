"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Net Worth",
      href: "/dashboard",
      icon: "📊",
      value: "$0.00"
    },
    {
      name: "Assets",
      href: "/assets",
      icon: "💎",
      value: "$0.00"
    },
    {
      name: "Debts",
      href: "/debts",
      icon: "∞",
      value: "$0.00"
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: "🏦",
      value: "$0.00"
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        isOpen ? "w-64" : "w-16"
      } lg:translate-x-0 ${!isOpen ? "-translate-x-full lg:translate-x-0" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {isOpen && (
          <h1 className="text-xl font-bold text-gray-900">Wealth Watch</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                {isOpen && <span className="font-medium">{item.name}</span>}
              </div>
              {isOpen && (
                <span className={`text-sm ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}>
                  {item.value}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      </div>
    </>
  );
}
