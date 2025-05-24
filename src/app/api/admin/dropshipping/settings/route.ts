import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET endpoint to fetch dropshipping settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get the first settings record or create a default if none exists
    let settings = await db.dropshippingSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await db.dropshippingSettings.create({
        data: {
          autoProcess: true,
          autoSendOrders: false,
          statusCheckInterval: 12,
          defaultShippingDays: 7,
          notificationEmail: "",
          profitMargin: 30,
          automaticFulfillment: true,
          notifyCustomerOnShipment: true,
          defaultSupplier: null,
          supplierNotes: "",
        }
      });
    }

    // Get all suppliers for the dropdown
    const suppliers = await db.supplier.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        status: "ACTIVE"
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ 
      settings,
      suppliers
    });
  } catch (error) {
    console.error("Error fetching dropshipping settings:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch dropshipping settings" }),
      { status: 500 }
    );
  }
}

// PUT endpoint to update dropshipping settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const data = await request.json();

    // Get the first settings record or create a new one if none exists
    let currentSettings = await db.dropshippingSettings.findFirst();
    let settings;

    if (currentSettings) {
      // Update existing settings
      settings = await db.dropshippingSettings.update({
        where: { id: currentSettings.id },
        data: {
          autoProcess: data.autoProcess,
          autoSendOrders: data.autoSendOrders,
          statusCheckInterval: data.statusCheckInterval,
          defaultShippingDays: data.defaultShippingDays,
          notificationEmail: data.notificationEmail || null,
          profitMargin: data.profitMargin,
          automaticFulfillment: data.automaticFulfillment,
          notifyCustomerOnShipment: data.notifyCustomerOnShipment,
          defaultSupplier: data.defaultSupplier || null,
          supplierNotes: data.supplierNotes || null,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new settings
      settings = await db.dropshippingSettings.create({
        data: {
          autoProcess: data.autoProcess,
          autoSendOrders: data.autoSendOrders,
          statusCheckInterval: data.statusCheckInterval,
          defaultShippingDays: data.defaultShippingDays,
          notificationEmail: data.notificationEmail || null,
          profitMargin: data.profitMargin,
          automaticFulfillment: data.automaticFulfillment,
          notifyCustomerOnShipment: data.notifyCustomerOnShipment,
          defaultSupplier: data.defaultSupplier || null,
          supplierNotes: data.supplierNotes || null,
        }
      });
    }

    // Log the action in the admin audit log
    await db.adminAuditLog.create({
      data: {
        id: Date.now().toString(), // Simple ID generation
        action: "UPDATE_DROPSHIPPING_SETTINGS",
        details: JSON.stringify(data),
        performedById: session.user.id,
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Dropshipping settings updated successfully",
      settings 
    });
  } catch (error) {
    console.error("Error updating dropshipping settings:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update dropshipping settings" }),
      { status: 500 }
    );
  }
}
