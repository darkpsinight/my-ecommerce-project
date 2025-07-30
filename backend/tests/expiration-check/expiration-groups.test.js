/**
 * Test suite for expiration groups functionality
 */

const { describe, it, expect, beforeEach, beforeAll, afterAll } = require('@jest/globals');
const mongoose = require('mongoose');
const { Listing } = require('../../models/listing');
const { Cart } = require('../../models/cart');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean up database before each test
  await Listing.deleteMany({});
  await Cart.deleteMany({});
});

describe('Expiration Groups', () => {
  describe('Listing Model - Expiration Groups', () => {
    it('should set expiration groups when adding codes', async () => {
      const listing = new Listing({
        title: 'Test Product',
        description: 'Test Description',
        price: 10.00,
        discountedPrice: 8.00,
        sellerId: 'test-seller-123',
        externalId: 'test-listing-123',
        category: 'games',
        platform: 'steam',
        region: 'global'
      });

      // Add codes with different expiration dates
      const codes = ['TEST-CODE-1', 'TEST-CODE-2', 'TEST-CODE-3'];
      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Add codes with expiration date
      listing.addCodes(codes.slice(0, 2), expirationDate);
      
      // Add codes without expiration date
      listing.addCodes(codes.slice(2), null);

      await listing.save();

      // Check that expiration groups are set correctly
      expect(listing.codes).toHaveLength(3);
      expect(listing.codes[0].expirationGroup).toBe('expires');
      expect(listing.codes[1].expirationGroup).toBe('expires');
      expect(listing.codes[2].expirationGroup).toBe('never_expires');
    });

    it('should get expiration groups correctly', async () => {
      const listing = new Listing({
        title: 'Test Product',
        description: 'Test Description',
        price: 10.00,
        discountedPrice: 8.00,
        sellerId: 'test-seller-123',
        externalId: 'test-listing-123',
        category: 'games',
        platform: 'steam',
        region: 'global'
      });

      // Add codes with different expiration dates
      const neverExpireCodes = ['NEVER-1', 'NEVER-2', 'NEVER-3'];
      const expiringCodes = ['EXPIRE-1', 'EXPIRE-2'];
      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      listing.addCodes(neverExpireCodes, null);
      listing.addCodes(expiringCodes, expirationDate);

      await listing.save();

      const groups = listing.getExpirationGroups();
      
      expect(groups).toHaveLength(2);
      
      // Check never_expires group
      const neverExpiresGroup = groups.find(g => g.type === 'never_expires');
      expect(neverExpiresGroup).toBeDefined();
      expect(neverExpiresGroup.quantity).toBe(3);
      
      // Check expires group
      const expiresGroup = groups.find(g => g.type === 'expires');
      expect(expiresGroup).toBeDefined();
      expect(expiresGroup.quantity).toBe(2);
      expect(expiresGroup.date).toBeDefined();
    });

    it('should get codes from expiration groups correctly', async () => {
      const listing = new Listing({
        title: 'Test Product',
        description: 'Test Description',
        price: 10.00,
        discountedPrice: 8.00,
        sellerId: 'test-seller-123',
        externalId: 'test-listing-123',
        category: 'games',
        platform: 'steam',
        region: 'global'
      });

      // Add codes with different expiration dates
      const neverExpireCodes = ['NEVER-1', 'NEVER-2'];
      const expiringCodes = ['EXPIRE-1', 'EXPIRE-2', 'EXPIRE-3'];
      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      listing.addCodes(neverExpireCodes, null);
      listing.addCodes(expiringCodes, expirationDate);

      await listing.save();

      // Request codes from specific groups
      const groupQuantities = [
        { type: 'never_expires', count: 1 },
        { type: 'expires', count: 2 }
      ];

      const selectedCodes = listing.getCodesFromExpirationGroups(groupQuantities);
      
      expect(selectedCodes).toHaveLength(3);
      
      // Check that we got the right codes
      const neverExpireSelected = selectedCodes.filter(code => code.expirationGroup === 'never_expires');
      const expiresSelected = selectedCodes.filter(code => code.expirationGroup === 'expires');
      
      expect(neverExpireSelected).toHaveLength(1);
      expect(expiresSelected).toHaveLength(2);
    });

    it('should throw error when requesting more codes than available in group', async () => {
      const listing = new Listing({
        title: 'Test Product',
        description: 'Test Description',
        price: 10.00,
        discountedPrice: 8.00,
        sellerId: 'test-seller-123',
        externalId: 'test-listing-123',
        category: 'games',
        platform: 'steam',
        region: 'global'
      });

      // Add only 2 codes
      listing.addCodes(['CODE-1', 'CODE-2'], null);
      await listing.save();

      // Request more codes than available
      const groupQuantities = [
        { type: 'never_expires', count: 5 }
      ];

      expect(() => {
        listing.getCodesFromExpirationGroups(groupQuantities);
      }).toThrow('Not enough codes available in never_expires group');
    });
  });

  describe('Cart Model - Expiration Groups', () => {
    it('should handle expiration groups in cart items', async () => {
      const cart = new Cart({
        userId: 'test-user-123',
        items: []
      });

      const itemData = {
        listingId: 'test-listing-123',
        listingObjectId: new mongoose.Types.ObjectId(),
        title: 'Test Product',
        price: 10.00,
        discountedPrice: 8.00,
        quantity: 3,
        sellerId: 'test-seller-123',
        expirationGroups: [
          { type: 'never_expires', count: 2 },
          { type: 'expires', count: 1, date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        ]
      };

      cart.addItem(itemData);
      await cart.save();

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].expirationGroups).toHaveLength(2);
      expect(cart.items[0].expirationGroups[0].type).toBe('never_expires');
      expect(cart.items[0].expirationGroups[0].count).toBe(2);
      expect(cart.items[0].expirationGroups[1].type).toBe('expires');
      expect(cart.items[0].expirationGroups[1].count).toBe(1);
    });

    it('should merge expiration groups when adding same listing', async () => {
      const cart = new Cart({
        userId: 'test-user-123',
        items: []
      });

      const itemData1 = {
        listingId: 'test-listing-123',
        listingObjectId: new mongoose.Types.ObjectId(),
        title: 'Test Product',
        price: 10.00,
        discountedPrice: 8.00,
        quantity: 2,
        sellerId: 'test-seller-123',
        expirationGroups: [
          { type: 'never_expires', count: 2 }
        ]
      };

      const itemData2 = {
        listingId: 'test-listing-123',
        listingObjectId: itemData1.listingObjectId,
        title: 'Test Product',
        price: 10.00,
        discountedPrice: 8.00,
        quantity: 1,
        sellerId: 'test-seller-123',
        expirationGroups: [
          { type: 'never_expires', count: 1 }
        ]
      };

      cart.addItem(itemData1);
      cart.addItem(itemData2);
      await cart.save();

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].expirationGroups).toHaveLength(1);
      expect(cart.items[0].expirationGroups[0].count).toBe(3);
    });
  });

  describe('Integration Tests', () => {
    it('should handle mixed expiration group scenarios', async () => {
      // Create a listing with mixed expiration codes
      const listing = new Listing({
        title: 'Mixed Expiration Product',
        description: 'Test Description',
        price: 15.00,
        discountedPrice: 12.00,
        sellerId: 'test-seller-123',
        externalId: 'mixed-listing-123',
        category: 'games',
        platform: 'steam',
        region: 'global'
      });

      // Add codes with different expiration scenarios
      const shortExpiryCodes = ['SHORT-1', 'SHORT-2'];
      const longExpiryCodes = ['LONG-1', 'LONG-2', 'LONG-3'];
      const neverExpireCodes = ['NEVER-1', 'NEVER-2', 'NEVER-3', 'NEVER-4'];

      const shortExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const longExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

      listing.addCodes(shortExpiryCodes, shortExpiryDate);
      listing.addCodes(longExpiryCodes, longExpiryDate);
      listing.addCodes(neverExpireCodes, null);

      await listing.save();

      // Get expiration groups
      const groups = listing.getExpirationGroups();
      
      // Should have 3 groups: never_expires, and 2 expires groups with different dates
      expect(groups.length).toBeGreaterThanOrEqual(2);
      
      const neverExpiresGroup = groups.find(g => g.type === 'never_expires');
      expect(neverExpiresGroup).toBeDefined();
      expect(neverExpiresGroup.quantity).toBe(4);

      const expiresGroups = groups.filter(g => g.type === 'expires');
      expect(expiresGroups.length).toBeGreaterThanOrEqual(1);
      
      // Total quantity should match
      const totalQuantity = groups.reduce((sum, group) => sum + group.quantity, 0);
      expect(totalQuantity).toBe(9); // 2 + 3 + 4
    });
  });
});