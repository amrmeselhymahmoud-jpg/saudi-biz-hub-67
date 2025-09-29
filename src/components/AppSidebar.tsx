import React, { useState } from "react"
import { 
  Home, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Menu,
  ChevronDown,
  HelpCircle,
  HeadphonesIcon,
  Building2,
  Wrench,
  CreditCard,
  FolderOpen,
  Target,
  Palette
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const mainMenuItems = [
  { title: "لوحة المتابعة", url: "/", icon: Home },
  { title: "الفواتير", url: "/invoices", icon: FileText },
  { title: "المشتريات", url: "/purchases", icon: ShoppingCart },
  { title: "المنتجات والخدمات", url: "/products", icon: Package },
  { title: "الأصول الثابتة", url: "/assets", icon: Building2 },
  { title: "البوائع", url: "/documents", icon: FolderOpen },
  { title: "المحاسبة", url: "/accounting", icon: DollarSign },
  { title: "المهام والمشاريع", url: "/tasks", icon: Target },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { title: "الخدمات الجرافيكية", url: "/graphics", icon: Palette },
]

const settingsItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
  { title: "تعرف على هذه الصفحة", url: "/help", icon: HelpCircle },
  { title: "مركز المساعدة", url: "/support", icon: HeadphonesIcon },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-white/20 text-white border-r-2 border-white font-medium shadow-sm backdrop-blur-sm" 
      : "text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"

  return (
    <Sidebar
      side="right"
      className={`${collapsed ? "w-16" : "w-72"} border-l bg-gradient-to-b from-primary to-primary/90 shadow-2xl transition-all duration-300 fixed right-0 top-0 h-full z-20 backdrop-blur-sm border-primary/20`}
      collapsible="icon"
    >
      <SidebarContent className="p-0">
        {/* Header */}
        {!collapsed && (
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-primary/80 to-primary backdrop-blur-sm">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-white/90 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary font-bold text-xl">ق</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-sm">QOYOD</h2>
                <p className="text-xs text-white/90 font-medium">نظام المحاسبة الذكي</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 rounded-lg">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={`${getNavCls(item.url)} flex items-center space-x-4 rtl:space-x-reverse px-4 py-3 rounded-lg transition-all duration-200 group`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse w-full">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium flex-1 text-right">{item.title}</span>
                        )}
                        {!collapsed && (
                          <ChevronDown className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <div className="mt-auto border-t border-white/20 bg-gradient-to-r from-primary/60 to-primary/80 backdrop-blur-sm">
          <SidebarGroup className="px-4 py-4">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                      <NavLink 
                        to={item.url}
                        className={`${getNavCls(item.url)} flex items-center space-x-4 rtl:space-x-reverse px-4 py-3 rounded-lg transition-all duration-200 group`}
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && (
                            <span className="text-sm font-medium flex-1 text-right">{item.title}</span>
                          )}
                          {!collapsed && (
                            <ChevronDown className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}