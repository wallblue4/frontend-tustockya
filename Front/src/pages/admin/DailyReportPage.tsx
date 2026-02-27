import React from 'react';
import DailyReportView from '../../components/admin/daily-report/DailyReportView';
import { useAdmin } from '../../context/AdminContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const DailyReportPage: React.FC = () => {
  const { locations, notifications, loadNotifications, handleApproveDiscount, setReceiptPreviewUrl } = useAdmin();

  return (
    <DailyReportView
      locations={locations}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      setReceiptPreviewUrl={setReceiptPreviewUrl}
      handleApproveDiscount={handleApproveDiscount}
      notifications={notifications}
      loadNotifications={loadNotifications}
    />
  );
};
