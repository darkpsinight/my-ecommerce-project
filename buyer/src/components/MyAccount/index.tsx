"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/redux/store";
import { selectAuthToken } from "@/redux/features/auth-slice";
import Orders from "../Orders";
import MyCodes from "./MyCodes";
import PageContainer from "../Common/PageContainer";
import ProtectedRoute from "../Common/ProtectedRoute";

const MyAccount = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-codes");
  const { user } = useAppSelector((state: any) => state.authReducer);

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["my-codes", "orders", "account-details"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without refreshing the page
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`/my-account?${params.toString()}`, { scroll: false });
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logout clicked");
    // You can implement logout functionality here
  };

  const tabs = [
    {
      id: "my-codes",
      label: "My Codes",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 22 22" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.875 2.0625C4.38968 2.0625 2.375 4.07718 2.375 6.5625V15.4375C2.375 17.9228 4.38968 19.9375 6.875 19.9375H15.125C17.6103 19.9375 19.625 17.9228 19.625 15.4375V6.5625C19.625 4.07718 17.6103 2.0625 15.125 2.0625H6.875ZM3.625 6.5625C3.625 4.76802 5.08052 3.3125 6.875 3.3125H15.125C16.9195 3.3125 18.375 4.76802 18.375 6.5625V15.4375C18.375 17.232 16.9195 18.6875 15.125 18.6875H6.875C5.08052 18.6875 3.625 17.232 3.625 15.4375V6.5625Z"
            fill="currentColor"
          />
          <path
            d="M7.5625 6.875C7.5625 6.52982 7.84232 6.25 8.1875 6.25H9.625C9.97018 6.25 10.25 6.52982 10.25 6.875C10.25 7.22018 9.97018 7.5 9.625 7.5H8.1875C7.84232 7.5 7.5625 7.22018 7.5625 6.875Z"
            fill="currentColor"
          />
          <path
            d="M7.5625 9.625C7.5625 9.27982 7.84232 9 8.1875 9H13.1875C13.5327 9 13.8125 9.27982 13.8125 9.625C13.8125 9.97018 13.5327 10.25 13.1875 10.25H8.1875C7.84232 10.25 7.5625 9.97018 7.5625 9.625Z"
            fill="currentColor"
          />
          <path
            d="M7.5625 12.375C7.5625 12.0298 7.84232 11.75 8.1875 11.75H11.9375C12.2827 11.75 12.5625 12.0298 12.5625 12.375C12.5625 12.7202 12.2827 13 11.9375 13H8.1875C7.84232 13 7.5625 12.7202 7.5625 12.375Z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-blue to-blue-light-2",
      color: "blue",
    },
    {
      id: "orders",
      label: "My Orders",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 22 22" fill="none">
          <path
            d="M8.0203 11.9167C8.0203 11.537 7.71249 11.2292 7.3328 11.2292C6.9531 11.2292 6.6453 11.537 6.6453 11.9167V15.5833C6.6453 15.963 6.9531 16.2708 7.3328 16.2708C7.71249 16.2708 8.0203 15.963 8.0203 15.5833V11.9167Z"
            fill="currentColor"
          />
          <path
            d="M14.6661 11.2292C15.0458 11.2292 15.3536 11.537 15.3536 11.9167V15.5833C15.3536 15.963 15.0458 16.2708 14.6661 16.2708C14.2864 16.2708 13.9786 15.963 13.9786 15.5833V11.9167C13.9786 11.537 14.2864 11.2292 14.6661 11.2292Z"
            fill="currentColor"
          />
          <path
            d="M11.687 11.9167C11.687 11.537 11.3792 11.2292 10.9995 11.2292C10.6198 11.2292 10.312 11.537 10.312 11.9167V15.5833C10.312 15.963 10.6198 16.2708 10.9995 16.2708C11.3792 16.2708 11.687 15.963 11.687 15.5833V11.9167Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.8338 3.18356C15.3979 3.01319 14.9095 2.98443 14.2829 2.97987C14.0256 2.43753 13.473 2.0625 12.8328 2.0625H9.16613C8.52593 2.0625 7.97332 2.43753 7.716 2.97987C7.08942 2.98443 6.60107 3.01319 6.16515 3.18356C5.64432 3.38713 5.19129 3.73317 4.85788 4.18211C4.52153 4.63502 4.36363 5.21554 4.14631 6.01456L3.57076 8.12557C3.21555 8.30747 2.90473 8.55242 2.64544 8.88452C2.07527 9.61477 1.9743 10.4845 2.07573 11.4822C2.17415 12.4504 2.47894 13.6695 2.86047 15.1955L2.88467 15.2923C3.12592 16.2573 3.32179 17.0409 3.55475 17.6524C3.79764 18.2899 4.10601 18.8125 4.61441 19.2095C5.12282 19.6064 5.70456 19.7788 6.38199 19.8598C7.03174 19.9375 7.8394 19.9375 8.83415 19.9375H13.1647C14.1594 19.9375 14.9671 19.9375 15.6169 19.8598C16.2943 19.7788 16.876 19.6064 17.3844 19.2095C17.8928 18.8125 18.2012 18.2899 18.4441 17.6524C18.6771 17.0409 18.8729 16.2573 19.1142 15.2923L19.1384 15.1956C19.5199 13.6695 19.8247 12.4504 19.9231 11.4822C20.0245 10.4845 19.9236 9.61477 19.3534 8.88452C19.0941 8.55245 18.7833 8.30751 18.4282 8.12562L17.8526 6.01455C17.6353 5.21554 17.4774 4.63502 17.141 4.18211C16.8076 3.73317 16.3546 3.38713 15.8338 3.18356Z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-green to-green-light-2",
      color: "green",
    },
    {
      id: "account-details",
      label: "Profile Settings",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 22 22" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.9995 1.14581C8.59473 1.14581 6.64531 3.09524 6.64531 5.49998C6.64531 7.90472 8.59473 9.85415 10.9995 9.85415C13.4042 9.85415 15.3536 7.90472 15.3536 5.49998C15.3536 3.09524 13.4042 1.14581 10.9995 1.14581ZM8.02031 5.49998C8.02031 3.85463 9.35412 2.52081 10.9995 2.52081C12.6448 2.52081 13.9786 3.85463 13.9786 5.49998C13.9786 7.14533 12.6448 8.47915 10.9995 8.47915C9.35412 8.47915 8.02031 7.14533 8.02031 5.49998Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.9995 11.2291C8.87872 11.2291 6.92482 11.7112 5.47697 12.5256C4.05066 13.3279 2.97864 14.5439 2.97864 16.0416L2.97858 16.1351C2.97754 17.2001 2.97624 18.5368 4.14868 19.4916C4.7257 19.9614 5.53291 20.2956 6.6235 20.5163C7.71713 20.7377 9.14251 20.8541 10.9995 20.8541C12.8564 20.8541 14.2818 20.7377 15.3754 20.5163C16.466 20.2956 17.2732 19.9614 17.8503 19.4916C19.0227 18.5368 19.0214 17.2001 19.0204 16.1351L19.0203 16.0416C19.0203 14.5439 17.9483 13.3279 16.522 12.5256C15.0741 11.7112 13.1202 11.2291 10.9995 11.2291Z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-teal to-blue-light",
      color: "teal",
    },
  ];

  return (
    <ProtectedRoute
      redirectMessage="Please sign in to access your account dashboard and manage your digital codes."
      redirectButtonText="Sign In to My Account"
    >
      <PageContainer fullWidth={true}>
        <section className="min-h-screen pt-[120px] pb-20 bg-gradient-to-br from-blue-light-5 via-white to-green-light-6">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6">
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue to-blue-light rounded-2xl mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-dark to-teal bg-clip-text text-transparent mb-4">
                Welcome Back!
              </h1>
              <p className="text-lg text-gray-6 max-w-2xl mx-auto">
                Manage your digital codes, track orders, and customize your account settings in one secure place.
              </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* Sidebar Navigation */}
              <div className="xl:max-w-[320px] w-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 overflow-hidden">
                  {/* User Profile Section */}
                  <div className="p-6 bg-gradient-to-r from-blue to-blue-light text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/30 shadow-lg">
                          <Image
                            src="/images/users/user-04.jpg"
                            alt="Profile"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {user?.displayName || "John Doe"}
                          </h3>
                          <p className="text-white/80 text-sm">
                            Member since {new Date().getFullYear()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">24</div>
                          <div className="text-xs text-white/80">Codes</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">12</div>
                          <div className="text-xs text-white/80">Orders</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="p-6">
                    <nav className="space-y-3">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`group w-full flex items-center gap-4 p-4 rounded-xl font-medium transition-all duration-300 ${
                            activeTab === tab.id
                              ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                              : "text-gray-6 hover:text-gray-7 hover:bg-gradient-to-r hover:from-gray-1 hover:to-gray-2 hover:shadow-md"
                          }`}
                        >
                          <div className={`
                            transition-transform duration-300 
                            ${activeTab === tab.id ? "scale-110" : "group-hover:scale-105"}
                          `}>
                            {tab.icon}
                          </div>
                          <span className="text-left">{tab.label}</span>
                          {activeTab === tab.id && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </button>
                      ))}
                      
                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-4 p-4 rounded-xl font-medium text-red hover:text-red-dark hover:bg-gradient-to-r hover:from-red-light-6 hover:to-red-light-5 transition-all duration-300 hover:shadow-md border-t border-gray-3 mt-6 pt-6"
                      >
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 22 22" fill="none">
                          <path
                            d="M13.7507 10.3125C14.1303 10.3125 14.4382 10.6203 14.4382 11C14.4382 11.3797 14.1303 11.6875 13.7507 11.6875H3.69247L5.48974 13.228C5.77802 13.4751 5.81141 13.9091 5.56431 14.1974C5.3172 14.4857 4.88318 14.5191 4.5949 14.272L1.38657 11.522C1.23418 11.3914 1.14648 11.2007 1.14648 11C1.14648 10.7993 1.23418 10.6086 1.38657 10.478L4.5949 7.72799C4.88318 7.48089 5.3172 7.51428 5.56431 7.80256C5.81141 8.09085 5.77802 8.52487 5.48974 8.77197L3.69247 10.3125H13.7507Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="text-left">Sign Out</span>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 min-h-[600px]">
                  {/* My Codes Tab */}
                  {activeTab === "my-codes" && (
                    <div className="h-full">
                      <div className="p-6 border-b border-gray-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue to-blue-light rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 22 22" fill="none">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M6.875 2.0625C4.38968 2.0625 2.375 4.07718 2.375 6.5625V15.4375C2.375 17.9228 4.38968 19.9375 6.875 19.9375H15.125C17.6103 19.9375 19.625 17.9228 19.625 15.4375V6.5625C19.625 4.07718 17.6103 2.0625 15.125 2.0625H6.875Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-7">My Digital Codes</h2>
                        </div>
                        <p className="text-gray-5">View and manage all your purchased digital codes</p>
                      </div>
                      <MyCodes isActive={activeTab === "my-codes"} />
                    </div>
                  )}

                  {/* Orders Tab */}
                  {activeTab === "orders" && (
                    <div className="h-full">
                      <div className="p-6 border-b border-gray-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-green to-green-light rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 22 22" fill="none">
                              <path
                                d="M8.0203 11.9167C8.0203 11.537 7.71249 11.2292 7.3328 11.2292C6.9531 11.2292 6.6453 11.537 6.6453 11.9167V15.5833C6.6453 15.963 6.9531 16.2708 7.3328 16.2708C7.71249 16.2708 8.0203 15.963 8.0203 15.5833V11.9167Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-7">Order History</h2>
                        </div>
                        <p className="text-gray-5">Track your purchases and order status</p>
                      </div>
                      <Orders />
                    </div>
                  )}

                  {/* Account Details Tab */}
                  {activeTab === "account-details" && (
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-teal to-blue-light rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 22 22" fill="none">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M10.9995 1.14581C8.59473 1.14581 6.64531 3.09524 6.64531 5.49998C6.64531 7.90472 8.59473 9.85415 10.9995 9.85415C13.4042 9.85415 15.3536 7.90472 15.3536 5.49998C15.3536 3.09524 13.4042 1.14581 10.9995 1.14581Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-7">Profile Settings</h2>
                          <p className="text-gray-5">Manage your account information and preferences</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Account Information */}
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Account Information</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-6 mb-2">Email Address</label>
                                <input
                                  type="email"
                                  value={user?.email || "john@example.com"}
                                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-blue focus:border-transparent"
                                  readOnly
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-6 mb-2">Display Name</label>
                                <input
                                  type="text"
                                  value={user?.displayName || "John Doe"}
                                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-blue focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-yellow-light-4 to-amber-100 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Security Settings</h3>
                            <div className="space-y-3">
                              <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-7">Change Password</span>
                                  <svg className="w-4 h-4 text-gray-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </button>
                              <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-7">Two-Factor Authentication</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green bg-green-light-5 px-2 py-1 rounded-full">Enabled</span>
                                    <svg className="w-4 h-4 text-gray-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Account Stats & Activity */}
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-green-light-6 to-teal-light rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Account Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue">24</div>
                                <div className="text-sm text-gray-5">Total Codes</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green">12</div>
                                <div className="text-sm text-gray-5">Orders</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-teal">$240</div>
                                <div className="text-sm text-gray-5">Total Spent</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-yellow">4.8</div>
                                <div className="text-sm text-gray-5">Rating</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-red-light-6 to-red-light-5 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Preferences</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-6">Email Notifications</span>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue transition-colors">
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-6">Marketing Updates</span>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-3 transition-colors">
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-6">Order Updates</span>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue transition-colors">
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <button className="w-full bg-gradient-to-r from-blue to-blue-light text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </ProtectedRoute>
  );
};

export default MyAccount;