/**
 * Server-Side Zoho CRM Contacts & Accounts Service
 *
 * Sourced directly from Zoho CRM Contacts and Accounts modules.
 * Links customer profiles to Contacts and corporate companies to Accounts.
 * Never stores passwords, tokens, or authentication secrets in Zoho CRM.
 */

import { zohoFetch, isZohoConfigured } from './client';
import { Address } from '@/types';

export interface ZohoContactPayload {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  gstin?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  websiteCustomerId?: string;
}

export interface ZohoContactRecord {
  id: string;
  First_Name?: string;
  Last_Name: string;
  Full_Name?: string;
  Email: string;
  Phone?: string;
  Mobile?: string;
  Account_Name?: { id: string; name: string };
  Mailing_Street?: string;
  Mailing_City?: string;
  Mailing_State?: string;
  Mailing_Zip?: string;
  Other_Street?: string;
  Other_City?: string;
  Other_State?: string;
  Other_Zip?: string;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface ZohoAccountRecord {
  id: string;
  Account_Name: string;
  Phone?: string;
  Billing_Street?: string;
  Billing_City?: string;
  Billing_State?: string;
  Billing_Code?: string;
  Description?: string;
}

export interface CustomerSyncResult {
  success: boolean;
  contactId?: string;
  accountId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Split full name into First_Name and mandatory Last_Name
 */
function parseContactName(fullName: string): { firstName: string; lastName: string } {
  const clean = fullName.trim().replace(/\s+/g, ' ');
  if (!clean) {
    return { firstName: '', lastName: 'Valued Customer' };
  }
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Upsert an organization / company in Zoho CRM Accounts module
 */
export async function syncCompanyToZohoAccount(
  companyName: string,
  details: {
    phone?: string;
    address?: Address;
    gstin?: string;
  } = {}
): Promise<{ success: boolean; accountId?: string; error?: string }> {
  const cleanCompanyName = companyName.trim();
  if (!cleanCompanyName || cleanCompanyName.toLowerCase() === 'individual' || cleanCompanyName.toLowerCase() === 'not provided') {
    return { success: true };
  }

  if (!(await isZohoConfigured())) {
    return { success: false, error: 'Zoho CRM not configured' };
  }

  try {
    const payload = {
      data: [
        {
          Account_Name: cleanCompanyName,
          Phone: details.phone?.trim() || undefined,
          Billing_Street: details.address ? `${details.address.addressLine1} ${details.address.addressLine2 || ''}`.trim() : undefined,
          Billing_City: details.address?.city?.trim() || undefined,
          Billing_State: details.address?.state?.trim() || undefined,
          Billing_Code: details.address?.pincode?.trim() || undefined,
          Description: details.gstin ? `GSTIN: ${details.gstin.trim()}` : undefined,
        },
      ],
      duplicate_check_fields: ['Account_Name'],
    };

    const res = await zohoFetch<any>('/Accounts/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const item = res?.data?.[0];
    const accountId = item?.details?.id;
    if (accountId) {
      return { success: true, accountId };
    }
    return { success: false, error: item?.message || 'Failed to upsert Account' };
  } catch (err: any) {
    return { success: false, error: err?.details?.message || err?.message || String(err) };
  }
}

/**
 * Synchronize a customer profile and addresses into Zoho CRM Contacts (and Accounts)
 */
export async function syncCustomerToZohoContact(
  customer: ZohoContactPayload
): Promise<CustomerSyncResult> {
  if (!(await isZohoConfigured())) {
    return { success: false, action: 'skipped', error: 'Zoho CRM not configured' };
  }

  const cleanEmail = customer.email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, action: 'failed', error: 'Email is required' };
  }

  try {
    // 1. Sync Company to Zoho Accounts if provided
    let accountId: string | undefined = undefined;
    if (customer.companyName) {
      const accRes = await syncCompanyToZohoAccount(customer.companyName, {
        phone: customer.phone,
        address: customer.billingAddress,
        gstin: customer.gstin,
      });
      if (accRes.success && accRes.accountId) {
        accountId = accRes.accountId;
      }
    }

    // 2. Parse Name
    const { firstName, lastName } = parseContactName(customer.name);

    // 3. Prepare Contact description (GSTIN, website customer ID, customer notes)
    const descParts = [
      customer.websiteCustomerId ? `Website Customer ID: ${customer.websiteCustomerId}` : '',
      customer.gstin ? `GSTIN: ${customer.gstin.trim()}` : '',
      `Registered via Office Bazzar Storefront`,
    ].filter(Boolean);

    // 4. Construct Contact payload
    const contactData: Record<string, any> = {
      First_Name: firstName || undefined,
      Last_Name: lastName,
      Email: cleanEmail,
      Phone: customer.phone?.trim() || undefined,
      Mobile: customer.phone?.trim() || undefined,
      Description: descParts.join(' | '),
    };

    if (accountId) {
      contactData.Account_Name = { id: accountId };
    }

    // Primary / Billing Address -> Mailing_* fields
    if (customer.billingAddress) {
      contactData.Mailing_Street = `${customer.billingAddress.addressLine1} ${customer.billingAddress.addressLine2 || ''}`.trim();
      contactData.Mailing_City = customer.billingAddress.city.trim();
      contactData.Mailing_State = customer.billingAddress.state.trim();
      contactData.Mailing_Zip = customer.billingAddress.pincode.trim();
    }

    // Secondary / Shipping Address -> Other_* fields
    if (customer.shippingAddress) {
      contactData.Other_Street = `${customer.shippingAddress.addressLine1} ${customer.shippingAddress.addressLine2 || ''}`.trim();
      contactData.Other_City = customer.shippingAddress.city.trim();
      contactData.Other_State = customer.shippingAddress.state.trim();
      contactData.Other_Zip = customer.shippingAddress.pincode.trim();
    }

    const payload = {
      data: [contactData],
      duplicate_check_fields: ['Email'],
    };

    const res = await zohoFetch<any>('/Contacts/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const item = res?.data?.[0];
    const contactId = item?.details?.id;
    const action = item?.action === 'insert' ? 'created' : 'updated';

    if (contactId) {
      console.log(`[ZohoContacts] Successfully synced customer [${cleanEmail}] to Zoho Contact ID: ${contactId}`);
      return {
        success: true,
        contactId,
        accountId,
        action,
      };
    }

    return {
      success: false,
      action: 'failed',
      error: item?.message || 'Failed to upsert Contact',
    };
  } catch (err: any) {
    const errorMsg = err?.details?.message || err?.message || String(err);
    console.error(`[ZohoContacts] Failed to sync customer [${cleanEmail}]:`, errorMsg);
    return {
      success: false,
      action: 'failed',
      error: errorMsg,
    };
  }
}

/**
 * Retrieve a customer's business profile and saved addresses directly from Zoho CRM Contacts
 */
export async function getCustomerProfileFromZoho(
  email: string
): Promise<{
  contact?: ZohoContactRecord;
  addresses: Address[];
} | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !(await isZohoConfigured())) {
    return null;
  }

  try {
    // Query Zoho CRM Contacts by email
    const res = await zohoFetch<any>(
      `/Contacts/search?email=${encodeURIComponent(cleanEmail)}`,
      { method: 'GET' }
    );

    const contact: ZohoContactRecord | undefined = res?.data?.[0];
    if (!contact) {
      return null;
    }

    const addresses: Address[] = [];

    // Extract Mailing Address (Primary / Office)
    if (contact.Mailing_Street || contact.Mailing_City) {
      addresses.push({
        fullName: contact.Full_Name || `${contact.First_Name || ''} ${contact.Last_Name}`.trim(),
        phone: contact.Phone || contact.Mobile || '',
        companyName: contact.Account_Name?.name || undefined,
        addressLine1: contact.Mailing_Street || '',
        city: contact.Mailing_City || '',
        state: contact.Mailing_State || '',
        pincode: contact.Mailing_Zip || '',
        isDefault: true,
      });
    }

    // Extract Other Address (Secondary / Warehouse / Shipping)
    if (contact.Other_Street || contact.Other_City) {
      addresses.push({
        fullName: contact.Full_Name || `${contact.First_Name || ''} ${contact.Last_Name}`.trim(),
        phone: contact.Phone || contact.Mobile || '',
        companyName: contact.Account_Name?.name || undefined,
        addressLine1: contact.Other_Street || '',
        city: contact.Other_City || '',
        state: contact.Other_State || '',
        pincode: contact.Other_Zip || '',
        isDefault: addresses.length === 0,
      });
    }

    return { contact, addresses };
  } catch (err: any) {
    console.warn(`[ZohoContacts] Error reading contact for [${cleanEmail}]:`, err?.details || err?.message);
    return null;
  }
}

/**
 * Save / Update a customer's address directly in Zoho CRM Contacts
 */
export async function saveCustomerAddressToZoho(
  email: string,
  address: Address
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email is required' };
  }

  try {
    const existing = await getCustomerProfileFromZoho(cleanEmail);
    const contact = existing?.contact;

    const contactData: Record<string, any> = {
      Last_Name: address.fullName || contact?.Last_Name || 'Valued Customer',
      Email: cleanEmail,
      Phone: address.phone || contact?.Phone || undefined,
      Mobile: address.phone || contact?.Mobile || undefined,
    };

    if (address.companyName) {
      const accRes = await syncCompanyToZohoAccount(address.companyName, {
        phone: address.phone,
        address,
        gstin: address.gstin,
      });
      if (accRes.success && accRes.accountId) {
        contactData.Account_Name = { id: accRes.accountId };
      }
    }

    // If Mailing address is not set, or if this address is marked as default, save to Mailing_*
    if (!contact?.Mailing_Street || address.isDefault) {
      contactData.Mailing_Street = `${address.addressLine1} ${address.addressLine2 || ''}`.trim();
      contactData.Mailing_City = address.city.trim();
      contactData.Mailing_State = address.state.trim();
      contactData.Mailing_Zip = address.pincode.trim();
    } else {
      // Otherwise save to Other_*
      contactData.Other_Street = `${address.addressLine1} ${address.addressLine2 || ''}`.trim();
      contactData.Other_City = address.city.trim();
      contactData.Other_State = address.state.trim();
      contactData.Other_Zip = address.pincode.trim();
    }

    const payload = {
      data: [contactData],
      duplicate_check_fields: ['Email'],
    };

    const res = await zohoFetch<any>('/Contacts/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const item = res?.data?.[0];
    if (item?.details?.id) {
      return { success: true };
    }
    return { success: false, error: item?.message || 'Failed to update address in Zoho CRM' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update address' };
  }
}
