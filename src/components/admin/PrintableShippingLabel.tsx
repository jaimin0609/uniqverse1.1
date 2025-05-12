import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintableShippingLabelProps {
    order: any;
    companyInfo: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        email?: string;
        phone?: string;
        website?: string;
        logo?: string;
    };
}

const PrintableShippingLabel = forwardRef<HTMLDivElement, PrintableShippingLabelProps>(({ order, companyInfo }, ref) => {
    if (!order || !order.shippingAddress) return null;

    const getTrackingUrl = () => {
        if (order.trackingUrl) return order.trackingUrl;
        if (order.trackingNumber) {
            return `https://yourwebsite.com/track?number=${order.trackingNumber}`;
        }
        return `https://yourwebsite.com/orders/${order.id}`;
    };

    return (
        <div ref={ref} className="p-4 w-[4in] h-[6in] mx-auto bg-white text-black border-2 border-gray-300 print:border-0">
            {/* Only visible when printing */}
            <div className="print:block hidden">
                <style type="text/css" media="print">
                    {`
          @page { size: 4in 6in; margin: 0; }
          body { margin: 0; padding: 0; }
          `}
                </style>
            </div>

            {/* From Address */}
            <div className="mb-4 text-xs">
                <p className="font-bold uppercase">FROM:</p>
                <p>{companyInfo.name}</p>
                <p>{companyInfo.address}</p>
                <p>{companyInfo.city}, {companyInfo.postalCode}</p>
                <p>{companyInfo.country}</p>
                {companyInfo.phone && <p>Phone: {companyInfo.phone}</p>}
            </div>

            {/* To Address */}
            <div className="mb-4 text-base">
                <p className="font-bold uppercase">TO:</p>
                <p className="text-lg font-bold">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="font-medium">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            </div>

            {/* Order Info */}
            <div className="mb-4 border-t border-b border-gray-300 py-2 text-center">
                <p className="font-bold">Order #: {order.orderNumber}</p>
                <p className="text-sm">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                {order.trackingNumber && (
                    <p className="text-sm">Tracking #: {order.trackingNumber}</p>
                )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-2">
                <QRCodeSVG
                    value={getTrackingUrl()}
                    size={100}
                    level="M"
                />
            </div>

            {/* Footer with shipping method */}
            <div className="text-center text-sm">
                <p>Shipping Method: {order.shippingMethod || 'Standard Shipping'}</p>
                <p>{order.items.reduce((total: number, item: any) => total + item.quantity, 0)} items</p>
            </div>
        </div>
    );
});

PrintableShippingLabel.displayName = 'PrintableShippingLabel';

export default PrintableShippingLabel;