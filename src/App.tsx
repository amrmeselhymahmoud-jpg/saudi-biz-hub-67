import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturesSection from "@/components/Features";
import Stats from "@/components/Stats";
import Footer from "@/components/Footer";
import FreeTrial from "./pages/FreeTrial";
import AboutPage from "./pages/About";
import FeaturesPage from "./pages/Features";
import PricingPage from "./pages/Pricing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Sales
import Customers from "./pages/Customers";
import Quotes from "./pages/Quotes";
import SalesInvoices from "./pages/SalesInvoices";
import CustomerBonds from "./pages/CustomerBonds";

// Purchases
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import SimpleInvoices from "./pages/SimpleInvoices";
import SupplierBonds from "./pages/SupplierBonds";

// Products & Costs
import ProductsCosts from "./pages/ProductsCosts";
import Locations from "./pages/Locations";
import ManufacturingOrders from "./pages/ManufacturingOrders";

// Fixed Assets
import FixedAssets from "./pages/FixedAssets";
import Depreciation from "./pages/Depreciation";
import Recoveries from "./pages/Recoveries";
import Additions from "./pages/Additions";

// Payroll
import Payroll from "./pages/Payroll";

// Accounting
import DeferredInvoices from "./pages/DeferredInvoices";
import AnnualEntries from "./pages/AnnualEntries";
import ManualEntries from "./pages/ManualEntries";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import Budgets from "./pages/Budgets";
import CommercialDocuments from "./pages/CommercialDocuments";
import RecurringTransactions from "./pages/RecurringTransactions";

// Projects & Tasks
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import ProjectReports from "./pages/ProjectReports";

// Professional Services
import BasicService from "./pages/BasicService";
import TrainingService from "./pages/TrainingService";
import InvoiceDesignService from "./pages/InvoiceDesignService";
import OpeningBalanceService from "./pages/OpeningBalanceService";
import AccountTransferService from "./pages/AccountTransferService";
import ConsultingServices from "./pages/ConsultingServices";
import QoyodAcademy from "./pages/QoyodAcademy";

// Settings
import GeneralSettings from "./pages/GeneralSettings";
import FinancialContexts from "./pages/FinancialContexts";
import NumberSettings from "./pages/NumberSettings";
import SubscriptionSettings from "./pages/SubscriptionSettings";
import ElectronicLinking from "./pages/ElectronicLinking";
import ForeignCurrencies from "./pages/ForeignCurrencies";
import Taxes from "./pages/Taxes";
import PayrollSettings from "./pages/PayrollSettings";
import Users from "./pages/Users";
import PaymentTerms from "./pages/PaymentTerms";
import AdditionalFields from "./pages/AdditionalFields";
import ProfileEdit from "./pages/ProfileEdit";
import Attachments from "./pages/Attachments";

// Footer
import AboutPageFooter from "./pages/AboutPage";
import HelpCenterFooter from "./pages/HelpCenter";

const queryClient = new QueryClient();

const HomePage = () => {
  const { isRTL } = useLanguage();
  
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
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
