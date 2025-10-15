// دوال مساعدة افتراضية (يجب تعريفها في نطاق عملك):
// const safeValue = (value) => value ?? '';
// const safeFormatDate = (date) => date ? new Date(date).toLocaleDateString('ar-SA') : '';
// const safeToLocaleString = (num) => num ? num.toLocaleString('ar-SA') : '0';
// const formatCurrency = (amount) => amount ? amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) : '0.00 ر.س';

/**
 * تتولى عملية إنشاء وطباعة فاتورة المبيعات.
 * @param invoice كائن فاتورة المبيعات (SalesInvoice) المراد طباعتها.
 */
const handlePrint = async (invoice /*: SalesInvoice */) => {
  console.log('Starting print process for invoice:', invoice.invoice_number);
  // @ts-ignore
  setIsPrinting(true);

  try {
    if (!invoice || !invoice.id) {
      throw new Error("فاتورة غير صالحة");
    }

    // جلب بنود/أصناف الفاتورة
    // @ts-ignore
    const items = await fetchInvoiceItems(invoice.id);
    const customer = invoice.customers;

    // تحديد وصف طريقة الدفع بالعربية
    let paymentMethodLabel = '';
    switch (invoice.payment_method) {
      case 'cash':
        paymentMethodLabel = 'نقداً';
        break;
      case 'transfer':
        paymentMethodLabel = 'تحويل بنكي';
        break;
      case 'card':
        paymentMethodLabel = 'بطاقة ائتمانية';
        break;
      default:
        paymentMethodLabel = 'آجل'; // الحالة الافتراضية لأي طريقة دفع غير محددة أو آجلة
        break;
    }

    // إنشاء محتوى الطباعة بصيغة HTML
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة ${/* @ts-ignore */ safeValue(invoice.invoice_number)}</title>
          <style>
            /* إعادة ضبط وتنسيقات أساسية */
            body { 
              font-family: 'Tahoma', 'Arial', sans-serif; /* خطوط مناسبة للعربية */
              direction: rtl; 
              color: #333; 
              margin: 0; 
              padding: 20px;
              line-height: 1.6;
            }
            @media print {
                body { padding: 0; } /* إزالة الهوامش عند الطباعة الفعلية */
                .info-section { display: block; } /* ضمان ظهور صناديق المعلومات بشكل متتالي عند الطباعة */
                .info-box { margin-bottom: 20px; }
            }
            
            /* الرأس (Header) */
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #0d9488;
              padding-bottom: 20px; 
            }
            .header h1 { 
              color: #047857; 
              margin: 0; 
              font-size: 2.2em; 
            }
            .header p { 
              color: #555; 
              font-size: 1em; 
              margin-top: 5px; 
            }
            
            /* قسم المعلومات (Info Section) */
            .info-section { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px; 
              gap: 20px; 
            }
            .info-box { 
              flex: 1; 
              padding: 15px; 
              background: #e0f2f1; 
              border-radius: 8px; 
              border: 1px solid #0d9488; 
            }
            .info-box h3 { 
              color: #047857; 
              margin-top: 0; 
              margin-bottom: 10px; 
              font-size: 1.2em; 
              border-bottom: 1px dashed #a7f3d0;
              padding-bottom: 5px;
            }
            .info-box p { 
              margin: 4px 0; 
              font-size: 0.95em; 
            }
            .info-box strong { 
              color: #1f2937; 
            }
            
            /* الجدول (Table) */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              border-radius: 8px; 
              overflow: hidden; 
            }
            th, td { 
              border: 1px solid #e0f2f1; 
              padding: 12px; 
              text-align: right; 
              word-break: break-word; /* لمنع تجاوز النص لحدود الخلية */
            }
            th { 
              background: #0d9488; 
              color: white; 
              font-weight: bold; 
              font-size: 1em;
            }
            tr:nth-child(even) { 
              background-color: #f7fcfb; 
            }
            
            /* الإجماليات (Totals) */
            .totals { 
              margin-top: 30px; 
              background: #f0fdf4; 
              padding: 20px; 
              border-radius: 8px; 
              border: 2px solid #a7f3d0; 
              width: 350px; 
              margin-right: auto; /* دفع الإجماليات لليسار (نهاية الصفحة في وضع RTL) */
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
              font-size: 1em; 
              padding-bottom: 5px;
              border-bottom: 1px dotted #d1d5db;
            }
            .total-row:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }
            .total-row span:first-child { 
              color: #555; 
            }
            .total-row span:last-child { 
              font-weight: bold; 
              color: #047857; 
            }
            .total-row strong span:last-child {
                font-size: 1.2em;
                color: #b91c1c; /* لون مميز للإجمالي الكلي */
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>فاتورة مبيعات</h1>
            <p>رقم الفاتورة: <strong>${/* @ts-ignore */ safeValue(invoice.invoice_number)}</strong></p>
            <p>التاريخ: <strong>${/* @ts-ignore */ safeFormatDate(invoice.invoice_date)}</strong></p>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>بيانات العميل</h3>
              <p><strong>الاسم:</strong> ${/* @ts-ignore */ safeValue(customer?.customer_name)}</p>
              <p><strong>الهاتف:</strong> ${/* @ts-ignore */ safeValue(customer?.phone)}</p>
              <p><strong>البريد:</strong> ${/* @ts-ignore */ safeValue(customer?.email)}</p>
            </div>
            <div class="info-box">
              <h3>بيانات الفاتورة</h3>
              <p><strong>تاريخ الإصدار:</strong> ${/* @ts-ignore */ safeFormatDate(invoice.invoice_date)}</p>
              <p><strong>تاريخ الاستحقاق:</strong> ${/* @ts-ignore */ safeFormatDate(invoice.due_date)}</p>
              <p><strong>طريقة الدفع:</strong> ${paymentMethodLabel}</p>
              <p><strong>الحالة:</strong> ${/* @ts-ignore */ safeValue(invoice.payment_status)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الضريبة</th>
                <th>الخصم</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${/* @ts-ignore */ safeValue(item.product_name)}</td>
                    <td>${/* @ts-ignore */ safeToLocaleString(item.quantity)}</td>
                    <td>${/* @ts-ignore */ formatCurrency(item.unit_price)}</td>
                    <td>${/* @ts-ignore */ formatCurrency(item.tax_amount)}</td>
                    <td>${/* @ts-ignore */ formatCurrency(item.discount)}</td>
                    <td>${/* @ts-ignore */ formatCurrency(item.total)}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span> <span>${/* @ts-ignore */ formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="total-row">
              <span>إجمالي الضريبة:</span> <span>${/* @ts-ignore */ formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div class="total-row">
              <span>الخصم:</span> <span>${/* @ts-ignore */ formatCurrency(invoice.discount)}</span>
            </div>
            <div class="total-row">
              <strong><span>الإجمالي الكلي:</span> <span>${/* @ts-ignore */ formatCurrency(invoice.total_amount)}</span></strong>
            </div>
            <div class="total-row">
              <span>المدفوع:</span> <span>${/* @ts-ignore */ formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div class="total-row">
              <span>المتبقي:</span> <span>${/* @ts-ignore */ formatCurrency(invoice.remaining_amount)}</span>
            </div>
          </div>
          ${invoice.notes ? `<p style="margin-top:40px; padding: 10px; border-top: 1px dashed #ccc;"><strong>ملاحظات:</strong> ${/* @ts-ignore */ invoice.notes}</p>` : ''}
        </body>
      </html>
    `;

    // فتح نافذة الطباعة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      // تأخير بسيط لضمان تحميل المحتوى قبل إرسال أمر الطباعة
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500); 
    } else {
        // رسالة تنبيه في حال منع متصفح المستخدم فتح النافذة المنبثقة
        alert("يرجى السماح بفتح النوافذ المنبثقة لإكمال عملية الطباعة.");
    }
  } catch (error) {
    console.error('Print error:', error);
    // @ts-ignore
    alert('حدث خطأ أثناء الطباعة: ' + (error?.message || 'خطأ غير معروف'));
  } finally {
    // @ts-ignore
    setIsPrinting(false);
  }
};