"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import DemoSignInButton from "./DemoSignInButton";
import { 
  BarChart3, 
  Gem, 
  CreditCard, 
  Link as LinkIcon, 
  Building2,
  Menu,
  User
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, isDemoUser, signInAsDemo } = useAuth();

  const navigationItems = [
    {
      name: "Net Worth",
      href: "/dashboard",
      icon: BarChart3,
      value: "$0.00"
    },
    {
      name: "Assets",
      href: "/assets",
      icon: Gem,
      value: "$0.00"
    },
    {
      name: "Debts",
      href: "/debts",
      icon: CreditCard,
      value: "$0.00"
    },
    {
      name: "Nexus",
      href: "/nexus",
      icon: LinkIcon,
      value: "$0.00"
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: Building2,
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
          <Menu className="w-5 h-5" />
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
                <item.icon className="w-5 h-5" />
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

      {/* Demo User Section */}
      <div className="mt-6 px-4">
        {!user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            {isOpen ? (
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-2">Try Demo</h3>
                <p className="text-xs text-blue-600 mb-3">
                  Sign in as a demo user to explore with sample data
                </p>
                <DemoSignInButton />
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (signInAsDemo) {
                    try {
                      await signInAsDemo();
                    } catch (error) {
                      console.error('Error calling signInAsDemo:', error);
                    }
                  } else {
                    console.error('signInAsDemo function is not available');
                  }
                }}
                className="w-full p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Sign in as Demo User"
              >
                <User className="w-5 h-5 mx-auto" />
              </button>
            )}
          </div>
        ) : isDemoUser ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            {isOpen ? (
              <div>
                <h3 className="text-sm font-medium text-green-800 mb-2">Demo User Active</h3>
                <p className="text-xs text-green-600 mb-3">
                  You&apos;re signed in as a demo user. All changes will be saved to the database.
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Demo User
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Demo
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>
      </div>
    </>
  );
}
