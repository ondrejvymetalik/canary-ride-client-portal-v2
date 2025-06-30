import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// Booqable API types
export interface BooqableCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  properties?: any;
  created_at: string;
  updated_at: string;
}

export interface BooqableOrder {
  id: string;
  number: string;
  status: string;
  starts_at: string;
  stops_at: string;
  customer_id: string;
  total_in_cents: number;
  deposit_in_cents: number;
  grand_total_in_cents: number;
  price_in_cents: number;
  total_paid_in_cents: number;
  to_be_paid_in_cents: number;
  properties?: any;
  lines?: any[];
  customer?: BooqableCustomer;
  created_at: string;
  updated_at: string;
}

export interface BooqableProduct {
  id: string;
  name: string;
  description?: string;
  price_in_cents: number;
  deposit_percentage?: number;
  photo_url?: string;
  properties?: any;
}

export interface BooqableDocument {
  id: string;
  type: 'documents';
  document_type: 'contract' | 'quote' | 'invoice';
  number: number;
  status: string;
  finalized: boolean;
  confirmed: boolean;
  sent: boolean;
  signature_url?: string;
  date: string;
  name: string;
  price_in_cents: number;
  grand_total_in_cents: number;
  order_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface BooqableSignature {
  id: string;
  document_id: string;
  signed: boolean;
  signed_at?: string;
  signature_url?: string;
  ip_address?: string;
  user_agent?: string;
}

class BooqableService {
  private api: AxiosInstance;
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor() {
    this.baseURL = process.env.BOOQABLE_API_URL || 'https://canaryride.booqable.com/api/4/';
    this.apiKey = process.env.BOOQABLE_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('BOOQABLE_API_KEY is required');
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 30000, // 30 seconds
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        logger.debug('Booqable API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
          // Don't log request body to avoid sensitive data
        });
        return config;
      },
      (error) => {
        logger.error('Booqable API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.api.interceptors.response.use(
      (response) => {
        logger.debug('Booqable API response', {
          status: response.status,
          url: response.config.url,
          // Don't log response data to avoid sensitive info
        });
        return response;
      },
      (error) => {
        logger.error('Booqable API error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        // Transform Booqable errors to our error format
        if (error.response?.status === 401) {
          throw new AppError('Unauthorized Booqable API access', 500, 'BOOQABLE_UNAUTHORIZED');
        }
        if (error.response?.status === 404) {
          throw new AppError('Resource not found in Booqable', 404, 'BOOQABLE_NOT_FOUND');
        }
        if (error.response?.status >= 500) {
          throw new AppError('Booqable service unavailable', 503, 'BOOQABLE_UNAVAILABLE');
        }

        throw new AppError('Booqable API error', 500, 'BOOQABLE_ERROR');
      }
    );
  }

  /**
   * Verify booking exists and belongs to email
   */
  async verifyBooking(bookingNumber: string, email: string): Promise<BooqableOrder | null> {
    try {
      // Search for order by number without trying to include lines (since it doesn't work)
      const response = await this.api.get('/orders', {
        params: {
          'filter[number]': bookingNumber,
        },
      });

      const orders = response.data?.data || [];
      
      if (orders.length === 0) {
        return null;
      }

      const order = orders[0];
      
      // Get customer details separately using customer_id
      const customerId = order.attributes?.customer_id;
      if (!customerId) {
        return null;
      }

      const customer = await this.getCustomerById(customerId);
      if (!customer) {
        return null;
      }

      // Check if order belongs to the email
      if (customer.email?.toLowerCase() !== email.toLowerCase()) {
        return null;
      }

      // Transform order and include customer data
      const transformedOrder = this.transformOrder(order);
      transformedOrder.customer = customer;

      // Fetch line items using the Lines API with order filter
      const lines = await this.fetchLinesByOrderId(order.id);
      transformedOrder.lines = lines;
      console.log('📦 Fetched lines using Lines API:', lines);
      
      return transformedOrder;
    } catch (error) {
      logger.error('Failed to verify booking', error, {
        bookingNumber: bookingNumber.substring(0, 3) + '***',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      });
      throw error;
    }
  }


  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<BooqableCustomer | null> {
    try {
      const response = await this.api.get('/customers', {
        params: {
          'filter[email]': email,
        },
      });

      const customers = response.data?.data || [];
      
      if (customers.length === 0) {
        return null;
      }

      return this.transformCustomer(customers[0]);
    } catch (error) {
      logger.error('Failed to get customer by email', error, {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<BooqableCustomer | null> {
    try {
      const response = await this.api.get(`/customers/${customerId}`);
      
      if (!response.data?.data) {
        return null;
      }

      return this.transformCustomer(response.data.data);
    } catch (error) {
      logger.error('Failed to get customer by ID', error, { customerId });
      throw error;
    }
  }

  /**
   * Get customer's bookings
   */
  async getCustomerBookings(customerId: string): Promise<BooqableOrder[]> {
    try {
      const response = await this.api.get('/orders', {
        params: {
          'filter[customer_id]': customerId,
          'sort[]': '-created_at',
          'include[]': 'lines,customer',
        },
      });

      const orders = response.data?.data || [];
      
      return orders.map((order: any) => this.transformOrder(order));
    } catch (error) {
      logger.error('Failed to get customer bookings', error, { customerId });
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<BooqableOrder | null> {
    try {
      const response = await this.api.get(`/orders/${orderId}`, {
        params: {
          'include[]': 'lines,customer',
        },
      });

      if (!response.data?.data) {
        return null;
      }

      return this.transformOrder(response.data.data);
    } catch (error) {
      logger.error('Failed to get order by ID', error, { orderId });
      throw error;
    }
  }

  /**
   * Get products
   */
  async getProducts(params?: any): Promise<BooqableProduct[]> {
    try {
      const response = await this.api.get('/products', { params });
      
      const products = response.data?.data || [];
      
      return products.map((product: any) => this.transformProduct(product));
    } catch (error) {
      logger.error('Failed to get products', error);
      throw error;
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, updateData: any): Promise<BooqableOrder> {
    try {
      const response = await this.api.put(`/orders/${orderId}`, {
        data: {
          type: 'orders',
          id: orderId,
          attributes: updateData,
        },
      });

      return this.transformOrder(response.data.data);
    } catch (error) {
      logger.error('Failed to update order', error, { orderId });
      throw error;
    }
  }

  /**
   * Create customer
   */
  async createCustomer(customerData: Partial<BooqableCustomer>): Promise<BooqableCustomer> {
    try {
      const response = await this.api.post('/customers', {
        data: {
          type: 'customers',
          attributes: customerData,
        },
      });

      return this.transformCustomer(response.data.data);
    } catch (error) {
      logger.error('Failed to create customer', error);
      throw error;
    }
  }

  /**
   * Create a contract for an order
   */
  async createContract(orderId: string): Promise<BooqableDocument> {
    try {
      const response = await this.api.post('/documents', {
        data: {
          type: 'documents',
          attributes: {
            document_type: 'contract',
            order_id: orderId
          }
        }
      });

      return this.transformDocument(response.data.data);
    } catch (error) {
      logger.error('Failed to create contract', error, { orderId });
      throw error;
    }
  }

  /**
   * Get documents for an order
   */
  async getOrderDocuments(orderId: string): Promise<BooqableDocument[]> {
    try {
      const response = await this.api.get('/documents', {
        params: {
          'filter[order_id]': orderId
        }
      });

      const documents = response.data?.data || [];
      return documents.map((doc: any) => this.transformDocument(doc));
    } catch (error) {
      logger.error('Failed to get order documents', error, { orderId });
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<BooqableDocument | null> {
    try {
      const response = await this.api.get(`/documents/${documentId}`);
      return this.transformDocument(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get document', error, { documentId });
      throw error;
    }
  }

  /**
   * Update document (for confirming signature)
   */
  async updateDocument(documentId: string, updateData: any): Promise<BooqableDocument> {
    try {
      const response = await this.api.put(`/documents/${documentId}`, {
        data: {
          type: 'documents',
          attributes: updateData
        }
      });

      return this.transformDocument(response.data.data);
    } catch (error) {
      logger.error('Failed to update document', error, { documentId });
      throw error;
    }
  }

  /**
   * Send document for signature
   */
  async sendDocumentForSignature(documentId: string): Promise<BooqableDocument> {
    try {
      const response = await this.api.put(`/documents/${documentId}`, {
        data: {
          type: 'documents',
          attributes: {
            sent: true
          }
        }
      });

      return this.transformDocument(response.data.data);
    } catch (error) {
      logger.error('Failed to send document for signature', error, { documentId });
      throw error;
    }
  }

  /**
   * Confirm document signature
   */
  async confirmDocumentSignature(documentId: string, signatureData?: any): Promise<BooqableDocument> {
    try {
      const response = await this.api.put(`/documents/${documentId}`, {
        data: {
          type: 'documents',
          attributes: {
            confirmed: true,
            status: 'confirmed',
            ...(signatureData && { signature_data: signatureData })
          }
        }
      });

      return this.transformDocument(response.data.data);
    } catch (error) {
      logger.error('Failed to confirm document signature', error, { documentId });
      throw error;
    }
  }

  /**
   * Transform Booqable order to our format
   */
  private transformOrder(order: any): BooqableOrder {
    const attributes = order.attributes || {};
    
    return {
      id: order.id,
      number: attributes.number,
      status: attributes.status,
      starts_at: attributes.starts_at,
      stops_at: attributes.stops_at,
      customer_id: attributes.customer_id,
      total_in_cents: attributes.total_in_cents || 0,
      deposit_in_cents: attributes.deposit_in_cents || 0,
      grand_total_in_cents: attributes.grand_total_in_cents || 0,
      price_in_cents: attributes.price_in_cents || 0,
      total_paid_in_cents: attributes.total_paid_in_cents || 0,
      to_be_paid_in_cents: attributes.to_be_paid_in_cents || 0,
      properties: attributes.properties,
      lines: attributes.lines,
      customer: attributes.customer ? this.transformCustomer({ attributes: attributes.customer }) : undefined,
      created_at: attributes.created_at,
      updated_at: attributes.updated_at,
    };
  }

  /**
   * Transform Booqable customer to our format
   */
  private transformCustomer(customer: any): BooqableCustomer {
    const attributes = customer.attributes || {};
    
    return {
      id: customer.id,
      email: attributes.email,
      first_name: attributes.first_name || '',
      last_name: attributes.last_name || '',
      phone: attributes.phone,
      properties: attributes.properties,
      created_at: attributes.created_at,
      updated_at: attributes.updated_at,
    };
  }

  /**
   * Transform Booqable product to our format
   */
  private transformProduct(product: any): BooqableProduct {
    const attributes = product.attributes || {};
    
    return {
      id: product.id,
      name: attributes.name,
      description: attributes.description,
      price_in_cents: attributes.price_in_cents || 0,
      deposit_percentage: attributes.deposit_percentage,
      photo_url: attributes.photo_url,
      properties: attributes.properties,
    };
  }

  /**
   * Transform Booqable document to our format
   */
  private transformDocument(document: any): BooqableDocument {
    const attributes = document.attributes || {};
    
    return {
      id: document.id,
      type: 'documents',
      document_type: attributes.document_type,
      number: attributes.number,
      status: attributes.status,
      finalized: attributes.finalized,
      confirmed: attributes.confirmed,
      sent: attributes.sent,
      signature_url: attributes.signature_url,
      date: attributes.date,
      name: attributes.name,
      price_in_cents: attributes.price_in_cents || 0,
      grand_total_in_cents: attributes.grand_total_in_cents || 0,
      order_id: attributes.order_id,
      customer_id: attributes.customer_id,
      created_at: attributes.created_at,
      updated_at: attributes.updated_at,
    };
  }

  /**
   * Fetch line items using the Lines API with order filter
   */
  private async fetchLinesByOrderId(orderId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/lines`, {
        params: {
          'filter[order_id]': orderId,
          'include': 'item,item.photos' // Include the item/product data with photos
        }
      });

      const lines = response.data?.data || [];
      const included = response.data?.included || [];
      
      // Debug logging to see what's included
      console.log('📋 Booqable Lines API response debug:', {
        linesCount: lines.length,
        includedCount: included.length,
        includedTypes: [...new Set(included.map((i: any) => i.type))],
        sampleIncluded: included.slice(0, 2).map((i: any) => ({
          type: i.type,
          id: i.id,
          hasPhotos: i.type === 'photos' ? true : false,
          productId: i.attributes?.product_id,
          photoUrl: i.attributes?.url
        }))
      });
      
      // Create a map of included items and photos for quick lookup
      const itemsMap = new Map();
      const photosMap = new Map();
      
      included.forEach((item: any) => {
        if (item.type === 'products' || item.type === 'items') {
          itemsMap.set(item.id, item);
        } else if (item.type === 'photos') {
          // Group photos by product_id
          const productId = item.attributes?.product_id;
          if (productId) {
            if (!photosMap.has(productId)) {
              photosMap.set(productId, []);
            }
            photosMap.get(productId).push({
              id: item.id,
              url: item.attributes?.url,
              large_url: item.attributes?.large_url,
              original_url: item.attributes?.original_url,
              position: item.attributes?.position || 0
            });
          }
        }
      });

      // Collect item IDs that are not in included data for separate fetching
      const missingItemIds = new Set<string>();
      lines.forEach((line: any) => {
        const itemId = line.attributes?.item_id;
        if (itemId && !itemsMap.has(itemId)) {
          missingItemIds.add(itemId);
        }
      });

      // Fetch missing items and also fetch photos for ALL items (both missing and included)
      const allItemIds = new Set<string>();
      
      // Add item IDs from included data
      itemsMap.forEach((_, itemId) => {
        allItemIds.add(itemId);
      });
      
      // Add missing item IDs
      missingItemIds.forEach((itemId) => {
        allItemIds.add(itemId);
      });

      // Fetch missing items in parallel
      const missingItemPromises = Array.from(missingItemIds).map(async (itemId) => {
        try {
          const itemResponse = await this.api.get(`/products/${itemId}`);
          if (itemResponse.data?.data) {
            return { id: itemId, data: itemResponse.data.data };
          }
        } catch (error: any) {
          console.log(`⚠️ Failed to fetch item ${itemId}:`, error.message);
        }
        return null;
      });

      // Try to fetch product with photos using different approaches
      const photoPromises = Array.from(allItemIds).map(async (itemId) => {
        try {
          // Try approach 1: Direct product fetch with photos include
          console.log(`🔍 Trying to fetch photos for product ${itemId}...`);
          
          const productResponse = await this.api.get(`/products/${itemId}`, {
            params: {
              'include': 'photos'
            }
          });
          
          console.log(`📦 Product response for ${itemId}:`, {
            hasData: !!productResponse.data?.data,
            hasIncluded: !!productResponse.data?.included,
            includedCount: productResponse.data?.included?.length || 0,
            productAttrs: Object.keys(productResponse.data?.data?.attributes || {}),
            photoUrl: productResponse.data?.data?.attributes?.photo_url
          });
          
          // Process included photos if any
          const included = productResponse.data?.included || [];
          const productPhotos = included
            .filter((item: any) => item.type === 'photos')
            .map((photo: any) => ({
              id: photo.id,
              url: photo.attributes?.url,
              large_url: photo.attributes?.large_url,
              original_url: photo.attributes?.original_url,
              position: photo.attributes?.position || 0
            }))
            .sort((a: any, b: any) => a.position - b.position);
          
          console.log(`📸 Found ${productPhotos.length} photos for product ${itemId}`);
          
          if (productPhotos.length > 0) {
            photosMap.set(itemId, productPhotos);
          }
        } catch (error: any) {
          console.log(`⚠️ Failed to fetch photos for item ${itemId}:`, error.message);
        }
      });

      const [missingItems] = await Promise.all([
        Promise.all(missingItemPromises),
        Promise.all(photoPromises)
      ]);
      
      // Add missing items to the map
      missingItems.forEach((result) => {
        if (result) {
          itemsMap.set(result.id, result.data);
        }
      });
      
      // Now process all lines with available item data
      return lines.map((line: any) => {
        const lineAttrs = line.attributes || {};
        const itemId = lineAttrs.item_id;
        
        // Get item from our map
        let item = null;
        if (itemId && itemsMap.has(itemId)) {
          const itemData = itemsMap.get(itemId);
          const itemAttrs = itemData.attributes || {};
          
          // Get photos for this item (from API or fallback to photo_url)
          let itemPhotos = photosMap.get(itemId) || [];
          // Sort photos by position
          itemPhotos.sort((a: any, b: any) => a.position - b.position);
          
          // If no photos from API but we have a photo_url, create a photos array from it
          let finalPhotos = itemPhotos;
          if (itemPhotos.length === 0 && (itemAttrs.photo_url || itemAttrs.image_url)) {
            const mainPhotoUrl = itemAttrs.photo_url || itemAttrs.image_url;
            finalPhotos = [{
              id: `${itemId}-main`,
              url: mainPhotoUrl,
              large_url: mainPhotoUrl,
              original_url: mainPhotoUrl,
              position: 0
            }];
            console.log(`📸 Created fallback photo array for ${itemId} from photo_url`);
          }
          
          item = {
            id: itemData.id,
            name: itemAttrs.name || 'Rental Item',
            description: itemAttrs.description || '',
            photo_url: itemAttrs.photo_url || itemAttrs.image_url, // Keep single photo for backwards compatibility
            photos: finalPhotos, // Add multiple photos array (from API or fallback)
            product_type: itemAttrs.product_type || 'rental',
          };
        }

        // Fallback item if none found
        if (!item) {
          item = {
            id: itemId || 'unknown',
            name: lineAttrs.title || 'Rental Item',
            description: lineAttrs.extra_information || '',
            photo_url: null,
            photos: [], // Empty photos array for consistency
            product_type: 'rental',
          };
        }

        console.log('📋 Processing line:', {
          lineId: line.id,
          title: lineAttrs.title,
          itemId: itemId,
          itemName: item.name,
          price: lineAttrs.price_in_cents
        });

        return {
          id: line.id,
          title: lineAttrs.title || item.name,
          quantity: lineAttrs.quantity || 1,
          price_in_cents: lineAttrs.price_in_cents || 0,
          display_price_in_cents: lineAttrs.display_price_in_cents || lineAttrs.price_in_cents || 0,
          charge_label: lineAttrs.charge_label || '',
          extra_information: lineAttrs.extra_information || '',
          item: item
        };
      });
    } catch (error) {
      logger.error('Failed to fetch lines using Lines API', error);
      return [];
    }
  }
}

export const booqableService = new BooqableService(); 