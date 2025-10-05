import { useState } from "react"
import { Chrome as Home, FileText, Users, Package, ChartBar as BarChart3, Settings, Plus, ChevronRight, ChevronDown, DollarSign, ShoppingCart, Calculator, CircleHelp as HelpCircle, Building2, Briefcase, FileBox, Wallet, MapPin, Factory, Recycle, TrendingUp, FolderTree, ClipboardList, Repeat, Layers, Link2, Coins, BookOpen, CreditCard, UserCog, HandCoins, Receipt, File as FileEdit, Paperclip, Info, LifeBuoy } from "lucide-react"
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
} from "@/components/ui/sidebar"

const mainMenuItems = [
  { title: "لوحة المتابعة", url: "/dashboard", icon: Home },
  { 
    title: "المبيعات", 
    icon: DollarSign,
    subItems: [
      { title: "العملاء", url: "/customers", icon: Users },
      { title: "عروض الأسعار", url: "/quotes", icon: FileText },
      { title: "فواتير المبيعات", url: "/sales-invoices", icon: Receipt },
      { title: "سندات العملاء", url: "/customer-bonds", icon: FileBox },
    ]
  },
  { 
    title: "المشتريات", 
    icon: ShoppingCart,
    subItems: [
      { title: "الموردين", url: "/suppliers", icon: Building2 },
      { title: "أوامر الشراء", url: "/purchase-orders", icon: ClipboardList },
      { title: "فواتير المشتريات", url: "/purchase-invoices", icon: Receipt },
      { title: "فواتير بسيطة", url: "/simple-invoices", icon: FileText },
      { title: "سندات الموردين", url: "/supplier-bonds", icon: FileBox },
    ]
  },
  { 
    title: "المنتجات والتكاليف", 
    icon: Package,
    subItems: [
      { title: "المنتجات والتكاليف", url: "/products-costs", icon: Package },
      { title: "المواقع", url: "/locations", icon: MapPin },
      { title: "أوامر التصنيع", url: "/manufacturing-orders", icon: Factory },
    ]
  },
  { 
    title: "الأصول الثابتة", 
    icon: Building2,
    subItems: [
      { title: "الأصول الثابتة", url: "/fixed-assets", icon: Building2 },
      { title: "الإهلاك", url: "/depreciation", icon: TrendingUp },
      { title: "الاستعادات", url: "/recoveries", icon: Recycle },
      { title: "الإضافات", url: "/additions", icon: Plus },
    ]
  },
  { title: "الرواتب", url: "/payroll", icon: Wallet },
  { 
    title: "المحاسبة", 
    icon: Calculator,
    subItems: [
      { title: "فواتير الأجل", url: "/deferred-invoices", icon: FileText },
      { title: "قيود سنوية", url: "/annual-entries", icon: FileEdit },
      { title: "قيود محاسبية يدوية", url: "/manual-entries", icon: FileEdit },
      { title: "شجرة الحسابات", url: "/chart-of-accounts", icon: FolderTree },
      { title: "الموازنات", url: "/budgets", icon: Layers },
      { title: "المستندات التجارية", url: "/commercial-documents", icon: FileBox },
      { title: "المعاملات المتكررة", url: "/recurring-transactions", icon: Repeat },
    ]
  },
  {
    title: "المهام والمشاريع",
    icon: Briefcase,
    subItems: [
      { title: "المشاريع", url: "/projects", icon: Briefcase },
      { title: "المهام", url: "/tasks", icon: ClipboardList },
      { title: "تقارير المشاريع", url: "/project-reports", icon: BarChart3 },
    ]
  },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { 
    title: "الخدمات الاحترافية", 
    icon: HelpCircle,
    subItems: [
      { title: "خدمة الأساسي", url: "/basic-service", icon: Info, badge: "متوفر الآن" },
      { title: "خدمة التدريب", url: "/training-service", icon: BookOpen, badge: "متوفر الآن" },
      { title: "خدمة تصميم الشواتير", url: "/invoice-design-service", icon: FileText, badge: "متوفر الآن" },
      { title: "خدمة إدخال الأرصدة الافتتاحية", url: "/opening-balance-service", icon: DollarSign, badge: "متوفر الآن" },
      { title: "خدمة نقل الحسابات", url: "/account-transfer-service", icon: Repeat, badge: "متوفر الآن" },
      { title: "الخدمات الاستشارية", url: "/consulting-services", icon: HelpCircle, badge: "متوفر الآن" },
      { title: "أكاديمية Finzo", url: "/qoyod-academy", icon: BookOpen, badge: "قريبا" },
    ]
  },
]

const settingsItems = [
  { 
    title: "الإعدادات", 
    icon: Settings,
    subItems: [
      { title: "الإعدادات العامة", url: "/general-settings", icon: Settings },
      { title: "السياقات المالية", url: "/financial-contexts", icon: Layers },
      { title: "إعدادات الأرقام", url: "/number-settings", icon: FileEdit },
      { title: "إعدادات الاشتراك", url: "/subscription-settings", icon: CreditCard, badge: "جديد" },
      { title: "الربط الإلكتروني", url: "/electronic-linking", icon: Link2 },
      { title: "العملات الأجنبية", url: "/foreign-currencies", icon: Coins },
      { title: "الضرائب", url: "/taxes", icon: Receipt },
      { title: "إعدادات الرواتب", url: "/payroll-settings", icon: Wallet },
      { title: "المستخدمين", url: "/users", icon: UserCog },
      { title: "شروط الدفع", url: "/payment-terms", icon: HandCoins },
      { title: "الحقول الإضافية", url: "/additional-fields", icon: FileEdit },
      { title: "تعديل الملف الشخصي", url: "/profile-edit", icon: UserCog },
      { title: "المرفقات", url: "/attachments", icon: Paperclip },
    ]
  },
]

const footerItems = [
  { title: "تعرف على هذه الصفحة", url: "/about-page", icon: Info },
  { title: "مركز المساعدة", url: "/help-center", icon: LifeBuoy },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard"
    return currentPath.startsWith(path)
  }

  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-md"
      : "hover:bg-gray-100 text-gray-700"
  
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }
  
  const isGroupExpanded = (title: string) => expandedGroups.includes(title)

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-72"} h-full bg-white border-r shadow-lg transition-all duration-300 z-50`}
      collapsible="icon"
    >
      <SidebarContent className="overflow-y-auto">
        {/* Header */}
        {!collapsed && (
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">F</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Finzo</h2>
                <p className="text-xs text-gray-600">نظام المحاسبة السحابي</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <SidebarGroup className="px-3 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-bold text-gray-500 px-3 mb-3 uppercase tracking-wider">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => (
                <div key={item.title}>
                  {'subItems' in item ? (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => toggleGroup(item.title)}
                          className="h-11 w-full hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <div className="flex items-center justify-between w-full gap-3 px-3 py-2">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                                isGroupExpanded(item.title)
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                              </div>
                              {!collapsed && <span className="text-sm font-medium text-gray-800">{item.title}</span>}
                            </div>
                            {!collapsed && (
                              isGroupExpanded(item.title)
                                ? <ChevronDown className="h-4 w-4 text-blue-600" />
                                : <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {!collapsed && isGroupExpanded(item.title) && (
                        <div className="mr-9 mt-2 space-y-1 border-r-2 border-gray-200 pr-3">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild className="h-10">
                                <NavLink
                                  to={subItem.url}
                                  className={`${getNavCls(subItem.url)} flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
                                >
                                  <div className="flex items-center gap-3">
                                    <subItem.icon className={`h-4 w-4 flex-shrink-0 ${isActive(subItem.url) ? 'text-white' : 'text-gray-500'}`} />
                                    <span className="text-sm">{subItem.title}</span>
                                  </div>
                                  {subItem.badge && (
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      subItem.badge === 'جديد'
                                        ? 'bg-green-100 text-green-600'
                                        : subItem.badge === 'قريبا'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-purple-100 text-purple-600'
                                    }`}>
                                      {subItem.badge}
                                    </span>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="h-11">
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className={`${getNavCls(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            isActive(item.url)
                              ? 'bg-white/20'
                              : 'bg-gray-100'
                          }`}>
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.url) ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup className="px-3 py-4 border-t border-gray-200 mt-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => toggleGroup(item.title)}
                      className="h-11 w-full hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <div className="flex items-center justify-between w-full gap-3 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            isGroupExpanded(item.title)
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                          </div>
                          {!collapsed && <span className="text-sm font-medium text-gray-800">{item.title}</span>}
                        </div>
                        {!collapsed && (
                          isGroupExpanded(item.title)
                            ? <ChevronDown className="h-4 w-4 text-orange-600" />
                            : <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {!collapsed && isGroupExpanded(item.title) && item.subItems && (
                    <div className="mr-9 mt-2 space-y-1 border-r-2 border-orange-200 pr-3">
                      {item.subItems.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton asChild className="h-10">
                            <NavLink
                              to={subItem.url}
                              className={`${getNavCls(subItem.url)} flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
                            >
                              <div className="flex items-center gap-3">
                                <subItem.icon className={`h-4 w-4 flex-shrink-0 ${isActive(subItem.url) ? 'text-white' : 'text-gray-500'}`} />
                                <span className="text-sm">{subItem.title}</span>
                              </div>
                              {subItem.badge && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                                  {subItem.badge}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer Items */}
        <SidebarGroup className="px-3 py-4 mt-auto border-t border-gray-200 bg-gray-50">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink
                      to={item.url}
                      className={`${getNavCls(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        isActive(item.url)
                          ? 'bg-white/20'
                          : 'bg-white'
                      }`}>
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.url) ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
