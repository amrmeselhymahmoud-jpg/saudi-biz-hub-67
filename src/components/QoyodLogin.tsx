import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const QoyodLogin = () => {
  const { user, session, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/auth");
    }
  }, [session, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-qoyod-muted">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-qoyod-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <h1 className="text-2xl font-bold text-primary">قيود</h1>
            <span className="text-qoyod-muted">نظام المحاسبة</span>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <User className="h-4 w-4 text-qoyod-muted" />
              <span className="text-sm text-qoyod-text">{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* مرحباً بك */}
          <Card className="border-qoyod-border shadow-card">
            <CardHeader>
              <CardTitle className="text-xl text-center text-qoyod-text">
                مرحباً بك في قيود
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-qoyod-muted mb-4">
                أهلاً وسهلاً بك في نظام قيود للمحاسبة وإدارة الأعمال
              </p>
              <p className="text-sm text-primary">
                البريد الإلكتروني: {user?.email}
              </p>
            </CardContent>
          </Card>

          {/* الفواتير */}
          <Card className="border-qoyod-border shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl text-center text-qoyod-text">
                الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-qoyod-muted mb-4">
                إنشاء وإدارة فواتير البيع والشراء
              </p>
              <Button className="w-full bg-primary hover:bg-primary-dark">
                إدارة الفواتير
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* العملاء */}
          <Card className="border-qoyod-border shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl text-center text-qoyod-text">
                العملاء
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-qoyod-muted mb-4">
                إدارة بيانات العملاء والموردين
              </p>
              <Button className="w-full bg-primary hover:bg-primary-dark">
                إدارة العملاء
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* المخزون */}
          <Card className="border-qoyod-border shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl text-center text-qoyod-text">
                المخزون
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-qoyod-muted mb-4">
                متابعة المخزون وحركة المنتجات
              </p>
              <Button className="w-full bg-primary hover:bg-primary-dark">
                إدارة المخزون
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* التقارير */}
          <Card className="border-qoyod-border shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl text-center text-qoyod-text">
                التقارير
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-qoyod-muted mb-4">
                تقارير مالية ومحاسبية شاملة
              </p>
              <Button className="w-full bg-primary hover:bg-primary-dark">
                عرض التقارير
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* الإعدادات */}
          <Card className="border-qoyod-border shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl text-center text-qoyod-text">
                الإعدادات
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-qoyod-muted mb-4">
                إعدادات النظام والشركة
              </p>
              <Button className="w-full bg-primary hover:bg-primary-dark">
                إدارة الإعدادات
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-qoyod-text mb-6 text-center">
            نظرة سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-blue-600">0</h3>
              <p className="text-blue-800">الفواتير المؤجلة</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-600">0</h3>
              <p className="text-green-800">المدفوعات اليوم</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-yellow-600">0</h3>
              <p className="text-yellow-800">المنتجات الناقصة</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-purple-600">0</h3>
              <p className="text-purple-800">العملاء الجدد</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QoyodLogin;