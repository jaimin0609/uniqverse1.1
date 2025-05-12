import React, { forwardRef } from 'react';
import { formatCurrency } from '@/utils/format';

interface PrintableInvoiceProps {
    order: any;
    companyInfo: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        email: string;
        phone: string;
        website: string;
        logo?: string;
    };
}

const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(({ order, companyInfo }, ref) => {
    if (!order) return null;

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div ref={ref} className="p-8 max-w-4xl mx-auto bg-white text-black print:shadow-none">
            {/* Only visible when printing */}
            <div className="print:block hidden">
                <style type="text/css" media="print">
                    {`
          @page { size: auto; margin: 15mm 10mm 15mm 10mm; }
          body { margin: 0; padding: 0; }
          `}
                </style>
            </div>

            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
                    <p className="text-gray-600">{companyInfo.address}</p>
                    <p className="text-gray-600">{companyInfo.city}, {companyInfo.postalCode}</p>
                    <p className="text-gray-600">{companyInfo.country}</p>
                    <p className="text-gray-600">{companyInfo.phone}</p>
                    <p className="text-gray-600">{companyInfo.email}</p>
                    <p className="text-gray-600">{companyInfo.website}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase text-gray-800 mb-2">Invoice</h2>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-gray-600">Date: {formatDate(order.createdAt)}</p>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
                <h3 className="text-gray-600 font-medium mb-2">Bill To:</h3>
                {order.billingAddress ? (
                    <div>
                        <p className="font-medium">{order.billingAddress.name}</p>
                        <p>{order.billingAddress.line1}</p>
                        {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
                        <p>
                            {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                        </p>
                        <p>{order.billingAddress.country}</p>
                        {order.billingAddress.phone && <p>Phone: {order.billingAddress.phone}</p>}
                    </div>
                ) : (
                    <p className="text-gray-500">No billing address provided</p>
                )}
            </div>

            {/* Ship To */}
            <div className="mb-8">
                <h3 className="text-gray-600 font-medium mb-2">Ship To:</h3>
                {order.shippingAddress ? (
                    <div>
                        <p className="font-medium">{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.line1}</p>
                        {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                        <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                        {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                    </div>
                ) : (
                    <p className="text-gray-500">No shipping address provided</p>
                )}
            </div>

            {/* Order Items */}
            <table className="w-full mb-8 text-left">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {order.items.map((item: any) => (
                        <tr key={item.id}>
                            <td className="p-3">
                                <div>
                                    <p className="font-medium">{item.product.name}</p>
                                    {item.options && item.options.length > 0 && (
                                        <p className="text-sm text-gray-600">
                                            {item.options.map((option: any) => `${option.name}: ${option.value}`).join(', ')}
                                        </p>
                                    )}
                                    {item.product.sku && (
                                        <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                                    )}
                                </div>
                            </td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">{formatCurrency(item.price)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Order Summary */}
            <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatCurrency(order.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(order.tax)}</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>-{formatCurrency(order.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(order.total)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Information */}
            <div className="mb-8">
                <h3 className="text-gray-600 font-medium mb-2">Payment Information:</h3>
                <p>Method: {order.paymentMethod}</p>
                <p>Status: {order.paymentStatus}</p>
                {order.trackingNumber && (
                    <p className="mt-2">Tracking Number: {order.trackingNumber}</p>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm border-t pt-4">
                <p>Thank you for your business!</p>
                <p>If you have any questions, please contact us at {companyInfo.email} or {companyInfo.phone}</p>
            </div>
        </div>
    );
});

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;