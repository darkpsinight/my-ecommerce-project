"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/redux/store";
import { userApi, UserInfo } from "@/services/user";
import { toast } from "react-hot-toast";

import PageContainer from "../Common/PageContainer";
import ProtectedRoute from "../Common/ProtectedRoute";

const MyAccount = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    phone: "",
    dateOfBirth: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { user, token } = useAppSelector((state: any) => state.authReducer);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const profile = await userApi.getUserInfo(token);
      setUserProfile(profile);
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
      });
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
      toast.error("Failed to load profile information");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize profile data
  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  // Check for section parameter in URL
  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (
      sectionParam &&
      ["profile", "security", "preferences", "privacy"].includes(sectionParam)
    ) {
      setActiveSection(sectionParam);
    }
  }, [searchParams]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Update URL without refreshing the page
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    router.push(`/my-account?${params.toString()}`, { scroll: false });
  };

  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) {
          errors.name = 'Name is required';
        } else if (value.length > 50) {
          errors.name = 'Name must be 50 characters or less';
        } else {
          delete errors.name;
        }
        break;
      case 'bio':
        if (value && value.length > 500) {
          errors.bio = 'Bio must be 500 characters or less';
        } else {
          delete errors.bio;
        }
        break;
      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          errors.phone = 'Please enter a valid phone number';
        } else {
          delete errors.phone;
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  const checkForUnsavedChanges = (newData: typeof profileData) => {
    if (!userProfile) return false;
    
    return (
      newData.name !== (userProfile.name || "") ||
      newData.bio !== (userProfile.bio || "") ||
      newData.phone !== (userProfile.phone || "") ||
      newData.dateOfBirth !== (userProfile.dateOfBirth || "")
    );
  };

  const handleProfileUpdate = (field: string, value: string) => {
    const newData = {
      ...profileData,
      [field]: value
    };
    
    setProfileData(newData);
    
    // Check for unsaved changes
    setHasUnsavedChanges(checkForUnsavedChanges(newData));
    
    // Validate the field in real-time
    validateField(field, value);
  };

  const handleCancelEdit = () => {
    // Reset profile data to original values
    if (userProfile) {
      setProfileData({
        name: userProfile.name || "",
        email: userProfile.email || "",
        bio: userProfile.bio || "",
        phone: userProfile.phone || "",
        dateOfBirth: userProfile.dateOfBirth || "",
      });
    }
    // Clear validation errors and unsaved changes flag
    setValidationErrors({});
    setHasUnsavedChanges(false);
    setIsEditingProfile(false);
  };

  const handlePasswordUpdate = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!profileData.name || profileData.name.trim().length === 0) {
        toast.error("Name is required");
        return;
      }
      
      if (profileData.name && profileData.name.length > 50) {
        toast.error("Name must be 50 characters or less");
        return;
      }
      
      if (profileData.bio && profileData.bio.length > 500) {
        toast.error("Bio must be 500 characters or less");
        return;
      }

      // Prepare data for API call (only send non-empty values)
      const updateData: any = {};
      if (profileData.name !== userProfile?.name) {
        updateData.name = profileData.name.trim();
      }
      if (profileData.bio !== userProfile?.bio) {
        updateData.bio = profileData.bio || null;
      }
      if (profileData.phone !== userProfile?.phone) {
        updateData.phone = profileData.phone || null;
      }
      if (profileData.dateOfBirth !== userProfile?.dateOfBirth) {
        updateData.dateOfBirth = profileData.dateOfBirth || null;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.success("No changes to save");
        setIsEditingProfile(false);
        return;
      }

      const updatedProfile = await userApi.updateProfile(token, updateData);
      setUserProfile(updatedProfile);
      setHasUnsavedChanges(false);
      setIsEditingProfile(false);
      
      // Create a more specific success message
      const updatedFields = Object.keys(updateData);
      const fieldNames = {
        name: 'Name',
        bio: 'Bio',
        phone: 'Phone Number',
        dateOfBirth: 'Date of Birth'
      };
      
      if (updatedFields.length === 1) {
        toast.success(`${fieldNames[updatedFields[0] as keyof typeof fieldNames]} updated successfully!`);
      } else {
        toast.success(`Profile updated successfully! (${updatedFields.length} fields changed)`);
      }
      
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    // Add API call to change password
    console.log("Changing password");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logout clicked");
    // You can implement logout functionality here
  };

  const calculateProfileCompletion = () => {
    if (!userProfile) return 0;
    
    const fields = [
      userProfile.name,
      userProfile.email,
      userProfile.bio,
      userProfile.phone,
      userProfile.dateOfBirth,
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const sections = [
    {
      id: "profile",
      label: "Profile Information",
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
      gradient: "from-blue to-blue-light-2",
      color: "blue",
    },
    {
      id: "security",
      label: "Security & Password",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 22 22" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11 1.83325C11.3866 1.83325 11.7492 2.02118 11.9756 2.33518L14.3089 5.49992H17.4166C18.1071 5.49992 18.7692 5.77424 19.2624 6.26738C19.7556 6.76052 20.0299 7.42258 20.0299 8.11325V16.4999C20.0299 17.1906 19.7556 17.8526 19.2624 18.3458C18.7692 18.8389 18.1071 19.1132 17.4166 19.1132H4.58325C3.89258 19.1132 3.23052 18.8389 2.73738 18.3458C2.24424 17.8526 1.96992 17.1906 1.96992 16.4999V8.11325C1.96992 7.42258 2.24424 6.76052 2.73738 6.26738C3.23052 5.77424 3.89258 5.49992 4.58325 5.49992H7.69087L10.0242 2.33518C10.2506 2.02118 10.6132 1.83325 11 1.83325ZM11 4.58325L9.16659 6.91659C8.94018 7.23059 8.57761 7.41845 8.19118 7.41845H4.58325C4.5832 7.41845 4.58325 7.41849 4.58325 7.41855V16.4999C4.58325 16.5 4.58329 16.4999 4.58325 16.4999H17.4166C17.4166 16.4999 17.4165 16.5 17.4166 16.4999V7.41855C17.4166 7.41849 17.4166 7.41845 17.4166 7.41845H13.8086C13.4222 7.41845 13.0596 7.23059 12.8332 6.91659L11 4.58325Z"
            fill="currentColor"
          />
          <path
            d="M11 9.62492C10.2777 9.62492 9.62492 10.2777 9.62492 10.9999C9.62492 11.7222 10.2777 12.3749 11 12.3749C11.7222 12.3749 12.3749 11.7222 12.3749 10.9999C12.3749 10.2777 11.7222 9.62492 11 9.62492Z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-red to-red-light-2",
      color: "red",
    },
    {
      id: "preferences",
      label: "Notifications & Preferences",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 2.0625C9.44036 2.0625 8.17708 3.32578 8.17708 4.88542V5.89062C6.75391 6.64063 5.77083 8.05078 5.77083 9.69792V14.4375C5.77083 15.1563 5.1875 15.7396 4.46875 15.7396C4.12357 15.7396 3.84375 16.0194 3.84375 16.3646C3.84375 16.7098 4.12357 16.9896 4.46875 16.9896H8.90625C8.90625 18.3438 10.0208 19.4583 11.375 19.4583C12.7292 19.4583 13.8438 18.3438 13.8438 16.9896H18.5312C18.8764 16.9896 19.1562 16.7098 19.1562 16.3646C19.1562 16.0194 18.8764 15.7396 18.5312 15.7396C17.8125 15.7396 17.2292 15.1563 17.2292 14.4375V9.69792C17.2292 8.05078 16.2461 6.64063 14.8229 5.89062V4.88542C14.8229 3.32578 13.5596 2.0625 12 2.0625H11ZM9.42708 4.88542C9.42708 4.01641 10.1311 3.3125 11 3.3125H12C12.8689 3.3125 13.5729 4.01641 13.5729 4.88542V5.5C12.5417 5.22917 11.4583 5.22917 10.4271 5.5V4.88542H9.42708ZM11 6.83333C12.9688 6.83333 14.5729 8.4375 14.5729 10.4062V14.4375C14.5729 14.7896 14.6875 15.1146 14.8854 15.3854H8.11458C8.3125 15.1146 8.42708 14.7896 8.42708 14.4375V10.4062C8.42708 8.4375 10.0312 6.83333 11 6.83333ZM11.375 18.2083C10.7115 18.2083 10.1562 17.6531 10.1562 16.9896H12.5938C12.5938 17.6531 12.0385 18.2083 11.375 18.2083Z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-yellow to-yellow-light-2",
      color: "yellow",
    },
    {
      id: "privacy",
      label: "Privacy & Data",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 22 22" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11 2.75C11.2834 2.75 11.5518 2.88125 11.7287 3.10625L14.1954 6.38125C14.3079 6.52625 14.4871 6.65 14.6954 6.65H18.5625C19.1041 6.65 19.5625 7.10844 19.5625 7.65V17.25C19.5625 17.7916 19.1041 18.25 18.5625 18.25H3.4375C2.89594 18.25 2.4375 17.7916 2.4375 17.25V7.65C2.4375 7.10844 2.89594 6.65 3.4375 6.65H7.30462C7.51288 6.65 7.69206 6.52625 7.80456 6.38125L10.2712 3.10625C10.4482 2.88125 10.7166 2.75 11 2.75ZM11 14.4375C12.7259 14.4375 14.125 13.0384 14.125 11.3125C14.125 9.58656 12.7259 8.1875 11 8.1875C9.27406 8.1875 7.875 9.58656 7.875 11.3125C7.875 13.0384 9.27406 14.4375 11 14.4375Z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-green to-green-light-2",
      color: "green",
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
                Profile Settings
              </h1>
              <p className="text-lg text-dark max-w-2xl mx-auto">
                Manage your personal information, security settings, and account preferences in one secure place.
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
                            {userProfile?.name || "Loading..."}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {"Member since " + new Date().getFullYear()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Profile Completion */}
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white/90">Profile Completion</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{calculateProfileCompletion()}%</span>
                            {calculateProfileCompletion() === 100 && (
                              <svg className="w-4 h-4 text-green-light" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className={`rounded-full h-2 transition-all duration-500 ${
                              calculateProfileCompletion() === 100 ? 'bg-green-light' : 'bg-white'
                            }`}
                            style={{ width: `${calculateProfileCompletion()}%` }}
                          ></div>
                        </div>
                        {calculateProfileCompletion() < 100 && (
                          <p className="text-xs text-white/70 mt-2">
                            Complete your profile to unlock all features and improve your marketplace experience
                          </p>
                        )}
                        {calculateProfileCompletion() === 100 && (
                          <p className="text-xs text-green-light mt-2 font-medium">
                            Profile complete! You&apos;re ready to explore the marketplace
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Sections */}
                  <div className="p-6">
                    <nav className="space-y-3">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => handleSectionChange(section.id)}
                          className={`group w-full flex items-center gap-4 p-4 rounded-xl font-medium transition-all duration-300 ${
                            activeSection === section.id
                              ? `bg-gradient-to-r ${section.gradient} text-white shadow-lg transform scale-105`
                              : "text-gray-6 hover:text-gray-7 hover:bg-gradient-to-r hover:from-gray-1 hover:to-gray-2 hover:shadow-md"
                          }`}
                        >
                          <div className={`
                            transition-transform duration-300 
                            ${activeSection === section.id ? "scale-110" : "group-hover:scale-105"}
                          `}>
                            {section.icon}
                          </div>
                          <span className="text-left">{section.label}</span>
                          {activeSection === section.id && (
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
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 min-h-[700px]">
                  
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center h-[700px]">
                      <div className="text-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-light border-t-blue mx-auto mb-6"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-7 mb-2">Loading your profile</h3>
                        <p className="text-gray-5">Please wait while we fetch your information...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Profile Information Section */}
                  {!isLoading && activeSection === "profile" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue to-blue-light rounded-lg flex items-center justify-center">
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
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold text-gray-7">Profile Information</h2>
                              {hasUnsavedChanges && (
                                <span className="px-2 py-1 bg-yellow-light text-yellow-dark text-xs font-medium rounded-full animate-pulse">
                                  Unsaved Changes
                                </span>
                              )}
                            </div>
                            <p className="text-dark">Manage your personal details and profile picture</p>
                          </div>
                        </div>
                        <button
                          onClick={() => isEditingProfile ? handleCancelEdit() : setIsEditingProfile(true)}
                          className={`px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 ${
                            isEditingProfile 
                              ? "bg-gradient-to-r from-red to-red-light text-white" 
                              : "bg-gradient-to-r from-blue to-blue-light text-white"
                          }`}
                        >
                          {isEditingProfile ? "Cancel" : "Edit Profile"}
                        </button>
                      </div>

                      <div className="grid lg:grid-cols-3 gap-8">
                        {/* Profile Picture Section */}
                        <div className="lg:col-span-1">
                          <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl p-6 text-center">
                            <div className="w-32 h-32 mx-auto mb-4 relative">
                              <Image
                                src="/images/users/user-04.jpg"
                                alt="Profile"
                                width={128}
                                height={128}
                                className="w-full h-full object-cover rounded-full ring-4 ring-white shadow-lg"
                              />
                              {isEditingProfile && (
                                <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue rounded-full flex items-center justify-center text-white hover:bg-blue-dark transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-7 mb-1">
                              {userProfile?.name || "Loading..."}
                            </h3>
                            <p className="text-sm text-gray-5">
                              {userProfile?.email || "No email"}
                            </p>
                            {isEditingProfile && (
                              <button className="mt-4 w-full bg-white text-blue border border-blue rounded-lg py-2 hover:bg-blue hover:text-white transition-colors">
                                Change Picture
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Profile Form */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className="bg-gradient-to-r from-green-light-6 to-teal-light rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-7">Personal Information</h3>
                              {isEditingProfile && (
                                <div className="flex items-center gap-2 text-sm text-dark">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Display name is required. Other fields are optional</span>
                                </div>
                              )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Display Name</label>
                                <input
                                  type="text"
                                  value={profileData.name}
                                  onChange={(e) => handleProfileUpdate("name", e.target.value)}
                                  disabled={!isEditingProfile}
                                  className={`w-full px-4 py-3 bg-white rounded-lg border focus:ring-2 focus:border-transparent disabled:bg-gray-1 ${
                                    validationErrors.name ? 'border-red focus:ring-red' : 'border-gray-3 focus:ring-blue'
                                  }`}
                                  placeholder="Enter your display name"
                                  required
                                />
                                {validationErrors.name && (
                                  <p className="text-red text-sm mt-1">{validationErrors.name}</p>
                                )}
                                <p className="text-dark text-sm mt-1">This is how your name will appear on the marketplace</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Email Address</label>
                                <input
                                  type="email"
                                  value={profileData.email}
                                  className="w-full px-4 py-3 bg-gray-1 rounded-lg border border-gray-3 cursor-not-allowed"
                                  readOnly
                                />
                                <p className="text-xs text-dark mt-1">Email cannot be changed directly. Contact support if needed.</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Phone Number</label>
                                <input
                                  type="tel"
                                  value={profileData.phone}
                                  onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                                  disabled={!isEditingProfile}
                                  className={`w-full px-4 py-3 bg-white rounded-lg border focus:ring-2 focus:border-transparent disabled:bg-gray-1 ${
                                    validationErrors.phone ? 'border-red focus:ring-red' : 'border-gray-3 focus:ring-blue'
                                  }`}
                                  placeholder="+1 (555) 123-4567"
                                />
                                {validationErrors.phone && (
                                  <p className="text-red text-sm mt-1">{validationErrors.phone}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Date of Birth</label>
                                <input
                                  type="date"
                                  value={profileData.dateOfBirth}
                                  onChange={(e) => handleProfileUpdate("dateOfBirth", e.target.value)}
                                  disabled={!isEditingProfile}
                                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-blue focus:border-transparent disabled:bg-gray-1"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-sm font-medium text-dark">Bio</label>
                                  <span className={`text-xs ${profileData.bio.length > 450 ? 'text-yellow' : 'text-dark'}`}>
                                    {profileData.bio.length}/500
                                  </span>
                                </div>
                                <textarea
                                  value={profileData.bio}
                                  onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                                  disabled={!isEditingProfile}
                                  rows={3}
                                  maxLength={500}
                                  className={`w-full px-4 py-3 bg-white rounded-lg border focus:ring-2 focus:border-transparent disabled:bg-gray-1 resize-none ${
                                    validationErrors.bio ? 'border-red focus:ring-red' : 'border-gray-3 focus:ring-blue'
                                  }`}
                                  placeholder="Tell us about yourself..."
                                />
                                {validationErrors.bio && (
                                  <p className="text-red text-sm mt-1">{validationErrors.bio}</p>
                                )}
                              </div>
                            </div>
                            {isEditingProfile && (
                              <div className="flex gap-3 mt-6">
                                <button
                                  onClick={handleSaveProfile}
                                  disabled={isSaving || Object.keys(validationErrors).length > 0}
                                  className="flex-1 bg-gradient-to-r from-blue to-blue-light text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                  {isSaving ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Saving...
                                    </>
                                  ) : (
                                    "Save Changes"
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security & Password Section */}
                  {activeSection === "security" && (
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-red to-red-light rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 22 22" fill="none">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11 1.83325C11.3866 1.83325 11.7492 2.02118 11.9756 2.33518L14.3089 5.49992H17.4166C18.1071 5.49992 18.7692 5.77424 19.2624 6.26738C19.7556 6.76052 20.0299 7.42258 20.0299 8.11325V16.4999C20.0299 17.1906 19.7556 17.8526 19.2624 18.3458C18.7692 18.8389 18.1071 19.1132 17.4166 19.1132H4.58325C3.89258 19.1132 3.23052 18.8389 2.73738 18.3458C2.24424 17.8526 1.96992 17.1906 1.96992 16.4999V8.11325C1.96992 7.42258 2.24424 6.76052 2.73738 6.26738C3.23052 5.77424 3.89258 5.49992 4.58325 5.49992H7.69087L10.0242 2.33518C10.2506 2.02118 10.6132 1.83325 11 1.83325Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-7">Security & Password</h2>
                          <p className="text-dark">Manage your password and security settings</p>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Change Password */}
                        <div className="bg-gradient-to-r from-red-light-6 to-red-light-5 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-7 mb-4">Change Password</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-dark mb-2">Current Password</label>
                              <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordUpdate("currentPassword", e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-red focus:border-transparent"
                                placeholder="Enter current password"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-dark mb-2">New Password</label>
                              <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordUpdate("newPassword", e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-red focus:border-transparent"
                                placeholder="Enter new password"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-dark mb-2">Confirm New Password</label>
                              <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordUpdate("confirmPassword", e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-red focus:border-transparent"
                                placeholder="Confirm new password"
                              />
                            </div>
                            <button
                              onClick={handleChangePassword}
                              className="w-full bg-gradient-to-r from-red to-red-light text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                            >
                              Update Password
                            </button>
                          </div>
                        </div>

                        {/* Security Options */}
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-yellow-light-4 to-amber-100 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Two-Factor Authentication</h3>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-medium text-gray-7">SMS Authentication</p>
                                <p className="text-sm text-gray-5">Receive codes via SMS</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">App Authentication</p>
                                <p className="text-sm text-gray-5">Use authenticator app</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-3 transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Login History</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-b border-gray-2">
                                <div>
                                  <p className="font-medium text-gray-7">Current Session</p>
                                  <p className="text-sm text-gray-5">Chrome on Windows • Now</p>
                                </div>
                                <span className="text-xs bg-green-light-5 text-green px-2 py-1 rounded-full">Active</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-gray-2">
                                <div>
                                  <p className="font-medium text-gray-7">Mobile Device</p>
                                  <p className="text-sm text-gray-5">Safari on iPhone • 2 hours ago</p>
                                </div>
                                <button className="text-xs text-red hover:underline">Revoke</button>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <div>
                                  <p className="font-medium text-gray-7">Previous Session</p>
                                  <p className="text-sm text-gray-5">Firefox on Mac • Yesterday</p>
                                </div>
                                <span className="text-xs text-gray-5">Expired</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications & Preferences Section */}
                  {activeSection === "preferences" && (
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow to-yellow-light rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 22 22" fill="none">
                            <path
                              d="M11 2.0625C9.44036 2.0625 8.17708 3.32578 8.17708 4.88542V5.89062C6.75391 6.64063 5.77083 8.05078 5.77083 9.69792V14.4375C5.77083 15.1563 5.1875 15.7396 4.46875 15.7396C4.12357 15.7396 3.84375 16.0194 3.84375 16.3646C3.84375 16.7098 4.12357 16.9896 4.46875 16.9896H8.90625C8.90625 18.3438 10.0208 19.4583 11.375 19.4583C12.7292 19.4583 13.8438 18.3438 13.8438 16.9896H18.5312C18.8764 16.9896 19.1562 16.7098 19.1562 16.3646C19.1562 16.0194 18.8764 15.7396 18.5312 15.7396C17.8125 15.7396 17.2292 15.1563 17.2292 14.4375V9.69792C17.2292 8.05078 16.2461 6.64063 14.8229 5.89062V4.88542C14.8229 3.32578 13.5596 2.0625 12 2.0625H11Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-7">Notifications & Preferences</h2>
                          <p className="text-dark">Control how you receive notifications and updates</p>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Email Notifications */}
                        <div className="bg-gradient-to-r from-yellow-light-4 to-amber-100 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-7 mb-4">Email Notifications</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">Order Updates</p>
                                <p className="text-sm text-dark">Notifications about your orders</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">New Listings</p>
                                <p className="text-sm text-dark">Updates about new digital codes</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">Marketing Emails</p>
                                <p className="text-sm text-dark">Promotional offers and news</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-3 transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">Security Alerts</p>
                                <p className="text-sm text-dark">Important security notifications</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-red transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Display Preferences */}
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-green-light-6 to-teal-light rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Display Preferences</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Language</label>
                                <select className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-green focus:border-transparent">
                                  <option>English (US)</option>
                                  <option>English (UK)</option>
                                  <option>Spanish</option>
                                  <option>French</option>
                                  <option>German</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Time Zone</label>
                                <select className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-green focus:border-transparent">
                                  <option>UTC-5 (Eastern Time)</option>
                                  <option>UTC-6 (Central Time)</option>
                                  <option>UTC-7 (Mountain Time)</option>
                                  <option>UTC-8 (Pacific Time)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-dark mb-2">Currency</label>
                                <select className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-green focus:border-transparent">
                                  <option>USD ($)</option>
                                  <option>EUR (€)</option>
                                  <option>GBP (£)</option>
                                  <option>CAD (C$)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Interface Settings</h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-7">Dark Mode</p>
                                  <p className="text-sm text-dark">Use dark theme</p>
                                </div>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-3 transition-colors">
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-7">Compact View</p>
                                  <p className="text-sm text-dark">Show more items per page</p>
                                </div>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue transition-colors">
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 text-center">
                        <button className="bg-gradient-to-r from-yellow to-yellow-light text-gray-7 font-semibold px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Privacy & Data Section */}
                  {activeSection === "privacy" && (
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-green to-green-light rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 22 22" fill="none">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11 2.75C11.2834 2.75 11.5518 2.88125 11.7287 3.10625L14.1954 6.38125C14.3079 6.52625 14.4871 6.65 14.6954 6.65H18.5625C19.1041 6.65 19.5625 7.10844 19.5625 7.65V17.25C19.5625 17.7916 19.1041 18.25 18.5625 18.25H3.4375C2.89594 18.25 2.4375 17.7916 2.4375 17.25V7.65C2.4375 7.10844 2.89594 6.65 3.4375 6.65H7.30462C7.51288 6.65 7.69206 6.52625 7.80456 6.38125L10.2712 3.10625C10.4482 2.88125 10.7166 2.75 11 2.75Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-7">Privacy & Data</h2>
                          <p className="text-dark">Control your privacy settings and data management</p>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Privacy Controls */}
                        <div className="bg-gradient-to-r from-green-light-6 to-teal-light rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-7 mb-4">Privacy Controls</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">Profile Visibility</p>
                                <p className="text-sm text-dark">Make profile visible to others</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">Activity Status</p>
                                <p className="text-sm text-dark">Show when you&apos;re online</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-3 transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-7">Purchase History</p>
                                <p className="text-sm text-dark">Allow analytics tracking</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green transition-colors">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Data Management */}
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Data Management</h3>
                            <div className="space-y-3">
                              <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-7">Download My Data</p>
                                    <p className="text-sm text-dark">Get a copy of your account data</p>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              </button>
                              <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-7">Data Portability</p>
                                    <p className="text-sm text-dark">Transfer data to another service</p>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </div>
                              </button>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-red-light-6 to-red-light-5 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-7 mb-4">Danger Zone</h3>
                            <div className="space-y-3">
                              <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-red-light-2 hover:bg-red-light-6 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-red">Clear All Data</p>
                                    <p className="text-sm text-dark">Remove all your data except account</p>
                                  </div>
                                  <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </div>
                              </button>
                              <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-red hover:bg-red-light-6 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-red">Delete Account</p>
                                    <p className="text-sm text-dark">Permanently delete your account</p>
                                  </div>
                                  <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </button>
                            </div>
                          </div>
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