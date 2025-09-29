import { useState } from "react"
import { 
  Home, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Plus,
  ChevronRight,
  ChevronDown,
  DollarSign,
  ShoppingCart,
  Calculator,
  HelpCircle,
  Building2,
  Briefcase,
  FileBox,
  Wallet,
  MapPin,
  Factory,
  Recycle,
  TrendingUp,
  FolderTree,
  ClipboardList,
  Repeat,
  Layers,
  Link2,
  Coins,
  BookOpen,
  CreditCard,
  UserCog,
  HandCoins,
  Receipt,
  FileEdit,
  Paperclip,
  Info,
  LifeBuoy
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
} from "@/components/ui/sidebar"

const mainMenuItems = [
  { title: "لوحة المتابعة", url: "/", icon: Home },
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
      { title: "فواتب التأجيل", url: "/deferred-invoices", icon: FileText },
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
      { title: "التقارير", url: "/project-reports", icon: BarChart3 },
    ]
  },
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
      { title: "أكاديمية قيود", url: "/qoyod-academy", icon: BookOpen, badge: "قريبا" },
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
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-muted/50"
  
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
      className={`${collapsed ? "w-16" : "w-80"} h-full bg-card transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="overflow-y-auto">
        {/* Header */}
        {!collapsed && (
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">ق</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">قيود</h2>
                <p className="text-xs text-muted-foreground">نظام المحاسبة</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <SidebarGroup className="px-3 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-2">
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
                          className="h-10 w-full"
                        >
                          <div className="flex items-center justify-between w-full space-x-3 rtl:space-x-reverse px-3 py-2">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              {!collapsed && <span className="text-sm">{item.title}</span>}
                            </div>
                            {!collapsed && (
                              isGroupExpanded(item.title) 
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {!collapsed && isGroupExpanded(item.title) && (
                        <div className="mr-6 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild className="h-9">
                                <NavLink 
                                  to={subItem.url}
                                  className={`${getNavCls(subItem.url)} flex items-center justify-between space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                                >
                                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">{subItem.title}</span>
                                  </div>
                                  {subItem.badge && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      subItem.badge === 'جديد' 
                                        ? 'bg-green-500/10 text-green-500' 
                                        : subItem.badge === 'قريبا'
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : 'bg-primary/10 text-primary'
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
                      <SidebarMenuButton asChild className="h-10">
                        <NavLink 
                          to={item.url}
                          end={item.url === "/"}
                          className={`${getNavCls(item.url)} flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
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
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => toggleGroup(item.title)}
                      className="h-10 w-full"
                    >
                      <div className="flex items-center justify-between w-full space-x-3 rtl:space-x-reverse px-3 py-2">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </div>
                        {!collapsed && (
                          isGroupExpanded(item.title) 
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {!collapsed && isGroupExpanded(item.title) && item.subItems && (
                    <div className="mr-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton asChild className="h-9">
                            <NavLink 
                              to={subItem.url}
                              className={`${getNavCls(subItem.url)} flex items-center justify-between space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                            >
                              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm">{subItem.title}</span>
                              </div>
                              {subItem.badge && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
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
        <SidebarGroup className="px-3 py-4 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url}
                      className={`${getNavCls(item.url)} flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
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
