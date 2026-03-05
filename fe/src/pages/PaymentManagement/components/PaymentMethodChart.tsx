import React from 'react';
import ComponentCard from "../../../components/common/ComponentCard";

interface PaymentMethodData {
  method: string;
  count: number;
  percentage: number;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  isLoading: boolean;
}

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ data, isLoading }) => {
  const getMethodColor = (method: string) => {
    const colors = {
      CASH: 'bg-green-500',
      CARD: 'bg-blue-500',
      BANK_TRANSFER: 'bg-purple-500',
      E_WALLET: 'bg-orange-500',
      INSURANCE: 'bg-red-500',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-500';
  };

  const getMethodLabel = (method: string) => {
    const labels = {
      CASH: 'Cash',
      CARD: 'Card',
      BANK_TRANSFER: 'Bank Transfer',
      E_WALLET: 'E-Wallet',
      INSURANCE: 'Insurance',
    };
    return labels[method as keyof typeof labels] || method;
  };

  if (isLoading) {
    return (
      <ComponentCard title="Payment Method Distribution">
        <div className="animate-pulse">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                <div className="w-12 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard title="Payment Method Distribution">
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.method} className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded ${getMethodColor(item.method)}`}></div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getMethodLabel(item.method)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getMethodColor(item.method)}`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ComponentCard>
  );
};

export default PaymentMethodChart;