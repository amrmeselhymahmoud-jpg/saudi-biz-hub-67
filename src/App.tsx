import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturesSection from "@/components/Features";
import Stats from "@/components/Stats";
import Footer from "@/components/Footer";
const FreeTrial = lazy(() => import("./pages/FreeTrial"));
const AboutPage = lazy(() => import("./pages/About"));
const FeaturesPage = lazy(() => import("./pages/Features"));
const PricingPage = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Customers = lazy(() => import("./pages/Customers"));
const Quotes = lazy(() => import("./pages/Quotes"));
const SalesInvoices = lazy(() => import("./pages/SalesInvoices"));
const CustomerBonds = lazy(() => import("./pages/CustomerBonds"));

const Suppliers = lazy(() => import("./pages/Suppliers"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const PurchaseInvoices = lazy(() => import("./pages/PurchaseInvoices"));
const SimpleInvoices = lazy(() => import("./pages/SimpleInvoices"));
const SupplierBonds = lazy(() => import("./pages/SupplierBonds"));

const ProductsCosts = lazy(() => import("./pages/ProductsCosts"));
const Locations = lazy(() => import("./pages/Locations"));
const ManufacturingOrders = lazy(() => import("./pages/ManufacturingOrders"));

const FixedAssets = lazy(() => import("./pages/FixedAssets"));
const Depreciation = lazy(() => import("./pages/Depreciation"));
const Recoveries = lazy(() => import("./pages/Recoveries"));
const Additions = lazy(() => import("./pages/Additions"));

const Payroll = lazy(() => import("./pages/Payroll"));

const DeferredInvoices = lazy(() => import("./pages/DeferredInvoices"));
const AnnualEntries = lazy(() => import("./pages/AnnualEntries"));
const ManualEntries = lazy(() => import("./pages/ManualEntries"));
const ChartOfAccounts = lazy(() => import("./pages/ChartOfAccounts"));
const Budgets = lazy(() => import("./pages/Budgets"));
const CommercialDocuments = lazy(() => import("./pages/CommercialDocuments"));
const RecurringTransactions = lazy(() => import("./pages/RecurringTransactions"));

const Projects = lazy(() => import("./pages/Projects"));
const Tasks = lazy(() => import("./pages/Tasks"));
const ProjectReports = lazy(() => import("./pages/ProjectReports"));

const BasicService = lazy(() => import("./pages/BasicService"));
const TrainingService = lazy(() => import("./pages/TrainingService"));
const InvoiceDesignService = lazy(() => import("./pages/InvoiceDesignService"));
const OpeningBalanceService = lazy(() => import("./pages/OpeningBalanceService"));
const AccountTransferService = lazy(() => import("./pages/AccountTransferService"));
const ConsultingServices = lazy(() => import("./pages/ConsultingServices"));
const QoyodAcademy = lazy(() => import("./pages/QoyodAcademy"));

const GeneralSettings = lazy(() => import("./pages/GeneralSettings"));
const FinancialContexts = lazy(() => import("./pages/FinancialContexts"));
const NumberSettings = lazy(() => import("./pages/NumberSettings"));
const SubscriptionSettings = lazy(() => import("./pages/SubscriptionSettings"));
const ElectronicLinking = lazy(() => import("./pages/ElectronicLinking"));
const ForeignCurrencies = lazy(() => import("./pages/ForeignCurrencies"));
const Taxes = lazy(() => import("./pages/Taxes"));
const PayrollSettings = lazy(() => import("./pages/PayrollSettings"));
const Users = lazy(() => import("./pages/Users"));
const PaymentTerms = lazy(() => import("./pages/PaymentTerms"));
const AdditionalFields = lazy(() => import("./pages/AdditionalFields"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Attachments = lazy(() => import("./pages/Attachments"));

const AboutPageFooter = lazy(() => import("./pages/AboutPage"));
const HelpCenterFooter = lazy(() => import("./pages/HelpCenter"));

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const HomePage = () => {
  const { isRTL } = useLanguage();
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate("/dashboard");
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <Hero />
      <FeaturesSection />
      <Stats />
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/free-trial" element={<FreeTrial />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/auth" element={<Auth />} />

                {/* Protected Routes with Layout */}
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Sales */}
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/sales-invoices" element={<SalesInvoices />} />
                  <Route path="/customer-bonds" element={<CustomerBonds />} />
                  
                  {/* Purchases */}
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/purchase-invoices" element={<PurchaseInvoices />} />
                  <Route path="/simple-invoices" element={<SimpleInvoices />} />
                  <Route path="/supplier-bonds" element={<SupplierBonds />} />
                  
                  {/* Products & Costs */}
                  <Route path="/products-costs" element={<ProductsCosts />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/manufacturing-orders" element={<ManufacturingOrders />} />
                  
                  {/* Fixed Assets */}
                  <Route path="/fixed-assets" element={<FixedAssets />} />
                  <Route path="/depreciation" element={<Depreciation />} />
                  <Route path="/recoveries" element={<Recoveries />} />
                  <Route path="/additions" element={<Additions />} />
                  
                  {/* Payroll */}
                  <Route path="/payroll" element={<Payroll />} />
                  
                  {/* Accounting */}
                  <Route path="/deferred-invoices" element={<DeferredInvoices />} />
                  <Route path="/annual-entries" element={<AnnualEntries />} />
                  <Route path="/manual-entries" element={<ManualEntries />} />
                  <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/commercial-documents" element={<CommercialDocuments />} />
                  <Route path="/recurring-transactions" element={<RecurringTransactions />} />
                  
                  {/* Projects & Tasks */}
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/project-reports" element={<ProjectReports />} />
                  
                  {/* Professional Services */}
                  <Route path="/basic-service" element={<BasicService />} />
                  <Route path="/training-service" element={<TrainingService />} />
                  <Route path="/invoice-design-service" element={<InvoiceDesignService />} />
                  <Route path="/opening-balance-service" element={<OpeningBalanceService />} />
                  <Route path="/account-transfer-service" element={<AccountTransferService />} />
                  <Route path="/consulting-services" element={<ConsultingServices />} />
                  <Route path="/qoyod-academy" element={<QoyodAcademy />} />
                  
                  {/* Settings */}
                  <Route path="/general-settings" element={<GeneralSettings />} />
                  <Route path="/financial-contexts" element={<FinancialContexts />} />
                  <Route path="/number-settings" element={<NumberSettings />} />
                  <Route path="/subscription-settings" element={<SubscriptionSettings />} />
                  <Route path="/electronic-linking" element={<ElectronicLinking />} />
                  <Route path="/foreign-currencies" element={<ForeignCurrencies />} />
                  <Route path="/taxes" element={<Taxes />} />
                  <Route path="/payroll-settings" element={<PayrollSettings />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/payment-terms" element={<PaymentTerms />} />
                  <Route path="/additional-fields" element={<AdditionalFields />} />
                  <Route path="/profile-edit" element={<ProfileEdit />} />
                  <Route path="/attachments" element={<Attachments />} />
                  
                  {/* Footer */}
                  <Route path="/about-page" element={<AboutPageFooter />} />
                  <Route path="/help-center" element={<HelpCenterFooter />} />
                </Route>

                {/* Catch-all Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
